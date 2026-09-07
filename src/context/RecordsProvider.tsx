import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FeedRecord, NewFeedRecord } from '../types';
import { MOCK_RECORDS } from '../mock/records';
import { createId } from '../utils/id';
import { readArray, STORAGE_KEYS, writeJson } from '../storage/local';
import { dehydratePhoto, hydratePhotos, needsHydration } from '../storage/photos';
import { createRecord, deleteRecord, patchRecord, subscribeRecords } from '../firebase/records';
import { useAuth } from '../hooks/useAuth';
import { RecordsContext, type RecordsContextValue } from './recordsContext';

/**
 * 기록 저장소.
 *
 * 로그인 여부에 따라 두 곳 중 하나를 쓴다.
 *   - 로그아웃: 이 기기 (localStorage + 사진은 IndexedDB)
 *   - 로그인:   Firestore users/{uid}/records (오프라인 캐시가 켜져 있어 비행기 모드에서도 쓴다)
 *
 * 로그인 중에는 **localStorage를 건드리지 않는다.** 계정이 비어 있을 때 로컬을 덮어쓰면
 * 아직 옮기지 않은 기록이 사라진다. 옮기는 일은 사용자가 확인한 뒤에만 한다
 * (src/storage/cloudSync.ts, CloudSyncBanner).
 */

/** 서버 상태를 uid와 함께 들고 있는다. 계정이 바뀌면 이전 계정 데이터가 잠깐 보이는 일이 없다 */
interface CloudState {
  uid: string;
  /** null이면 아직 첫 스냅샷을 못 받았다는 뜻 */
  records: FeedRecord[] | null;
  error: string | null;
}

/** 매 렌더마다 새 배열을 만들지 않으려고 하나를 돌려 쓴다 */
const EMPTY: FeedRecord[] = [];

/** 저장된 기록. 없으면(첫 실행) mock으로 시작한다 */
function loadRecords(): FeedRecord[] {
  return readArray<FeedRecord>(STORAGE_KEYS.records) ?? MOCK_RECORDS;
}

export function RecordsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, expectsUser } = useAuth();
  const uid = user?.uid ?? null;

  /**
   * 계정 저장소를 볼 차례인지.
   *
   * uid가 아직 없어도 "지난번에 로그인했었다"면 계정 쪽으로 친다.
   * 그러지 않으면 인증을 확인하는 짧은 사이에 이 기기의 기록이 보였다가
   * 계정 기록으로 바뀌어, 목록이 한 번 깜빡인다.
   */
  const usingCloud = uid !== null || (authLoading && expectsUser);

  const [localRecords, setLocalRecords] = useState<FeedRecord[]>(loadRecords);
  const [cloud, setCloud] = useState<CloudState | null>(null);

  // ── 로그인 중: Firestore 구독 ──────────────
  useEffect(() => {
    if (!uid) return;

    return subscribeRecords(
      uid,
      (next) => {
        // 사진 원본이 이 기기에 있으면 되살린다 (다른 기기에서 올린 기록은 사진 없이 온다)
        void hydrateAll(next).then((records) => setCloud({ uid, records, error: null }));
      },
      () =>
        setCloud((prev) => ({
          uid,
          records: prev?.uid === uid ? prev.records : null,
          error: '기록을 불러오지 못했어요. 연결을 확인해 주세요.',
        })),
    );
  }, [uid]);

  // ── 로그아웃 상태: 사진 되살리기 (첫 마운트 1회) ──
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const stored = loadRecords();
    if (!stored.some((record) => needsHydration(record.photos))) return;

    // cleanup에서 결과를 버리지 않는다 — StrictMode의 이중 실행에서 첫 실행의 결과가
    // 취소되면 두 번째 실행은 ref에 막혀 아무것도 안 해 사진이 영영 안 붙는다
    void hydrateAll(stored).then(setLocalRecords);
  }, []);

  // ── 로그아웃 상태에서만 이 기기에 저장 ──────
  useEffect(() => {
    if (uid) return;
    writeJson(
      STORAGE_KEYS.records,
      localRecords.map((record) => ({ ...record, photos: record.photos.map(dehydratePhoto) })),
    );
  }, [localRecords, uid]);

  // 계정이 바뀌는 순간 이전 계정의 데이터를 그리지 않도록 uid를 맞춰 본다
  const currentCloud = cloud && cloud.uid === uid ? cloud : null;
  const records = usingCloud ? (currentCloud?.records ?? EMPTY) : localRecords;

  const getRecord = useCallback(
    (id: string) => records.find((record) => record.id === id),
    [records],
  );

  const addRecord = useCallback(
    (input: NewFeedRecord) => {
      const now = new Date().toISOString();
      const record: FeedRecord = { ...input, id: createId(), createdAt: now, updatedAt: now };

      if (uid) {
        // 서버 응답을 기다리지 않는다. 화면은 방금 만든 id로 바로 이동하고,
        // 오프라인 캐시가 스냅샷을 먼저 돌려준다
        void createRecord(uid, record.id, input);
      } else {
        setLocalRecords((prev) => [record, ...prev]);
      }
      return record;
    },
    [uid],
  );

  const updateRecord = useCallback(
    (id: string, patch: Partial<NewFeedRecord>) => {
      if (uid) {
        void patchRecord(uid, id, patch);
        return;
      }
      setLocalRecords((prev) =>
        prev.map((record) =>
          record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record,
        ),
      );
    },
    [uid],
  );

  const removeRecord = useCallback(
    (id: string) => {
      if (uid) {
        void deleteRecord(uid, id);
        return;
      }
      setLocalRecords((prev) => prev.filter((record) => record.id !== id));
    },
    [uid],
  );

  const brands = useMemo(
    () =>
      [...new Set(records.map((r) => r.brand).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'ko'),
      ),
    [records],
  );

  const flavors = useMemo(
    () =>
      [...new Set(records.map((r) => r.flavor).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'ko'),
      ),
    [records],
  );

  const value = useMemo<RecordsContextValue>(
    () => ({
      records,
      // 로그인 직후 첫 스냅샷을 기다리는 동안만 true
      loading: usingCloud && currentCloud?.records == null,
      syncError: currentCloud?.error ?? null,
      getRecord,
      addRecord,
      updateRecord,
      removeRecord,
      brands,
      flavors,
    }),
    [records, usingCloud, currentCloud, getRecord, addRecord, updateRecord, removeRecord, brands, flavors],
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

function hydrateAll(records: FeedRecord[]): Promise<FeedRecord[]> {
  return Promise.all(
    records.map(async (record) => ({ ...record, photos: await hydratePhotos(record.photos) })),
  );
}
