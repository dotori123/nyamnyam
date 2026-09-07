import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Cat, NewCat } from '../types';
import { MOCK_CATS } from '../mock/cats';
import { createId } from '../utils/id';
import { readArray, readJson, STORAGE_KEYS, writeJson } from '../storage/local';
import { dehydratePhoto, hydratePhoto, needsHydration } from '../storage/photos';
import { createCat, deleteCat, patchCat, subscribeCats } from '../firebase/cats';
import { useAuth } from '../hooks/useAuth';
import { CatsContext, type CatsContextValue } from './catsContext';

/**
 * 고양이 프로필 저장소.
 *
 * 저장 위치를 고르는 규칙은 RecordsProvider와 같다 —
 * 로그아웃이면 이 기기, 로그인이면 Firestore users/{uid}/cats.
 *
 * "이 아이로 전환"한 선택은 계정이 아니라 **기기**에 저장한다.
 * 폰에서 보는 아이와 태블릿에서 보는 아이가 달라도 이상하지 않고,
 * 오히려 기기마다 기억하는 편이 자연스럽다.
 */

interface CloudState {
  uid: string;
  cats: Cat[] | null;
  error: string | null;
}

const EMPTY: Cat[] = [];

function loadCats(): Cat[] {
  return readArray<Cat>(STORAGE_KEYS.cats) ?? MOCK_CATS;
}

export function CatsProvider({ children }: { children: ReactNode }) {
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

  const [localCats, setLocalCats] = useState<Cat[]>(loadCats);
  const [cloud, setCloud] = useState<CloudState | null>(null);

  /**
   * 사용자가 명시적으로 고른 고양이.
   * 실제로 쓰이는 값은 아래 selectedCat에서 파생한다
   * (고른 아이가 삭제됐거나 아직 안 골랐으면 첫 마리로 대체).
   */
  const [pickedCatId, setPickedCatId] = useState<string | null>(
    () => readJson<string>(STORAGE_KEYS.selectedCat) ?? null,
  );

  useEffect(() => {
    if (!uid) return;

    return subscribeCats(
      uid,
      (next) => {
        void hydrateAll(next).then((cats) => setCloud({ uid, cats, error: null }));
      },
      () =>
        setCloud((prev) => ({
          uid,
          cats: prev?.uid === uid ? prev.cats : null,
          error: '프로필을 불러오지 못했어요. 연결을 확인해 주세요.',
        })),
    );
  }, [uid]);

  // 로그아웃 상태: 프로필 사진 되살리기 (첫 마운트 1회, RecordsProvider와 같은 이유로 취소하지 않는다)
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const stored = loadCats();
    if (!stored.some((cat) => needsHydration(cat.photo ? [cat.photo] : []))) return;

    void hydrateAll(stored).then(setLocalCats);
  }, []);

  useEffect(() => {
    if (uid) return;
    writeJson(
      STORAGE_KEYS.cats,
      localCats.map((cat) => ({ ...cat, photo: cat.photo ? dehydratePhoto(cat.photo) : null })),
    );
  }, [localCats, uid]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.selectedCat, pickedCatId);
  }, [pickedCatId]);

  const currentCloud = cloud && cloud.uid === uid ? cloud : null;
  const cats = usingCloud ? (currentCloud?.cats ?? EMPTY) : localCats;

  const getCat = useCallback(
    (id: string | null) => (id ? cats.find((cat) => cat.id === id) : undefined),
    [cats],
  );

  const addCat = useCallback(
    (input: NewCat) => {
      const now = new Date().toISOString();
      const cat: Cat = { ...input, id: createId('cat'), createdAt: now, updatedAt: now };

      if (uid) void createCat(uid, cat.id, input);
      else setLocalCats((prev) => [...prev, cat]);

      return cat;
    },
    [uid],
  );

  const updateCat = useCallback(
    (id: string, patch: Partial<NewCat>) => {
      if (uid) {
        void patchCat(uid, id, patch);
        return;
      }
      setLocalCats((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, ...patch, updatedAt: new Date().toISOString() } : cat,
        ),
      );
    },
    [uid],
  );

  const removeCat = useCallback(
    (id: string) => {
      if (uid) {
        // 이 아이를 참조하던 기록은 지우지 않고 catId만 미지정으로 되돌린다 (firebase/cats.ts)
        void deleteCat(uid, id);
        return;
      }
      setLocalCats((prev) => prev.filter((cat) => cat.id !== id));
    },
    [uid],
  );

  const selectCat = useCallback((id: string | null) => setPickedCatId(id), []);

  // 고른 아이가 사라졌으면 남은 첫 마리로 자동 대체된다
  const selectedCat = useMemo(
    () => cats.find((cat) => cat.id === pickedCatId) ?? cats[0],
    [cats, pickedCatId],
  );
  const selectedCatId = selectedCat?.id ?? null;

  const value = useMemo<CatsContextValue>(
    () => ({
      cats,
      loading: usingCloud && currentCloud?.cats == null,
      syncError: currentCloud?.error ?? null,
      getCat,
      addCat,
      updateCat,
      removeCat,
      selectedCatId,
      selectCat,
      selectedCat,
    }),
    [cats, usingCloud, currentCloud, getCat, addCat, updateCat, removeCat, selectedCatId, selectCat, selectedCat],
  );

  return <CatsContext.Provider value={value}>{children}</CatsContext.Provider>;
}

function hydrateAll(cats: Cat[]): Promise<Cat[]> {
  return Promise.all(cats.map(async (cat) => ({ ...cat, photo: await hydratePhoto(cat.photo) })));
}
