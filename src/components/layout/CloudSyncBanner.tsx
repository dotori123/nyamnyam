import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  dismissMigration,
  isDismissed,
  isMigrated,
  migrateLocalToCloud,
  readLocalSnapshot,
} from '../../storage/cloudSync';
import './CloudSyncBanner.scss';

type Status = 'asking' | 'working' | 'done' | 'failed' | 'hidden';

/**
 * "이 기기의 기록을 계정으로 옮길까요?"
 *
 * 로그인하면 저장소가 Firestore로 바뀌는데, 계정이 비어 있으면 목록이 텅 빈 채로 뜬다.
 * 그 순간 "내 기록 어디 갔지?"가 되지 않도록 화면 위에 계속 띄워 둔다.
 *
 * 막지 않는(모달이 아닌) 형태로 둔 이유: 옮기지 않고 그냥 쓰는 것도 정상적인 선택이라
 * 앱 사용을 가로막을 이유가 없다.
 *
 * 계정이 바뀌면 상태가 초기화돼야 해서 AppLayout이 uid를 key로 준다.
 */
export default function CloudSyncBanner() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [status, setStatus] = useState<Status>('asking');

  /** 이 기기에 옮길 게 남아 있는지. localStorage 동기 읽기라 렌더 중에 봐도 된다 */
  const counts = useMemo(() => {
    if (!uid || isMigrated(uid) || isDismissed(uid)) return null;

    const snapshot = readLocalSnapshot();
    if (snapshot.records.length === 0 && snapshot.cats.length === 0) return null;

    return { records: snapshot.records.length, cats: snapshot.cats.length };
  }, [uid]);

  if (!uid || !counts || status === 'hidden') return null;

  const handleMigrate = async () => {
    setStatus('working');
    try {
      await migrateLocalToCloud(uid);
      setStatus('done');
      // 다 옮겼다는 걸 잠깐 보여주고 사라진다
      window.setTimeout(() => setStatus('hidden'), 2500);
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'done') {
    return (
      <div className="cloud-banner cloud-banner--done" role="status">
        계정으로 옮겼어요. 이제 다른 기기에서도 보여요.
      </div>
    );
  }

  return (
    <div className="cloud-banner" role="status">
      <p className="cloud-banner__text">
        이 기기에 <strong>기록 {counts.records}건</strong>
        {counts.cats > 0 && <> · 고양이 {counts.cats}마리</>}가 있어요. 계정으로 옮길까요?
        <span className="cloud-banner__note">옮겨도 이 기기의 기록은 그대로 남아요.</span>
      </p>

      {status === 'failed' && (
        <p className="cloud-banner__error" role="alert">
          옮기지 못했어요. 연결을 확인하고 다시 시도해 주세요.
        </p>
      )}

      <div className="cloud-banner__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            dismissMigration(uid);
            setStatus('hidden');
          }}
          disabled={status === 'working'}
        >
          나중에
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void handleMigrate()}
          disabled={status === 'working'}
        >
          {status === 'working' ? '옮기는 중…' : '계정으로 옮기기'}
        </button>
      </div>
    </div>
  );
}
