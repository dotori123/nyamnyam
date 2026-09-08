import { useEffect, useRef, useState } from 'react';
import {
  applyBackup,
  backupFileName,
  BackupError,
  buildBackup,
  estimateBackupSize,
  parseBackup,
  type BackupFile,
  type BackupSummary,
} from '../../storage/backup';
import './BackupPanel.scss';

type Status = 'idle' | 'working';

/**
 * 백업 파일 내보내기 / 가져오기.
 *
 * 가져오기는 기존 기록을 통째로 덮어쓰기 때문에,
 * 파일을 먼저 읽어 내용을 보여주고 한 번 더 확인을 받은 다음에 적용한다.
 */
export default function BackupPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  /** 읽기까지 끝났고 사용자 확인만 남은 파일 */
  const [pending, setPending] = useState<BackupFile | null>(null);

  useEffect(() => {
    let alive = true;
    void estimateBackupSize().then((next) => {
      if (alive) setSummary(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handleExport = async () => {
    setError(null);
    setStatus('working');
    try {
      const { blob } = await buildBackup();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName();
      link.click();

      // 바로 회수하면 브라우저가 저장을 시작하기 전에 주소가 사라질 수 있다
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError('백업 파일을 만들지 못했어요. 사진이 너무 많으면 실패할 수 있어요.');
    } finally {
      setStatus('idle');
    }
  };

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStatus('working');
    try {
      setPending(await parseBackup(file));
    } catch (caught) {
      setError(caught instanceof BackupError ? caught.message : '파일을 읽지 못했어요.');
    } finally {
      setStatus('idle');
    }
  };

  const handleApply = async () => {
    if (!pending) return;
    setStatus('working');
    try {
      await applyBackup(pending);
      // Provider들이 새 데이터를 처음부터 다시 읽게 한다
      window.location.reload();
    } catch {
      setError('가져오기에 실패했어요. 저장 공간이 부족할 수 있어요.');
      setStatus('idle');
    }
  };

  const busy = status === 'working';

  return (
    <div className="backup-panel">
      {pending ? (
        <>
          <p className="backup-panel__warn">
            지금 기록 {summary?.records ?? 0}건 · 고양이 {summary?.cats ?? 0}마리를 지우고, 파일에
            들어 있는 <strong>기록 {pending.records.length}건 · 고양이 {pending.cats.length}마리</strong>
            로 바꿉니다. 되돌릴 수 없어요.
          </p>
          {pending.exportedAt && (
            <p className="backup-panel__meta">
              내보낸 날짜 · {new Date(pending.exportedAt).toLocaleString('ko-KR')}
            </p>
          )}
          <div className="backup-panel__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPending(null)}
              disabled={busy}
            >
              취소
            </button>
            <button type="button" className="btn btn--danger" onClick={handleApply} disabled={busy}>
              {busy ? '가져오는 중…' : '덮어쓰기'}
            </button>
          </div>
        </>
      ) : (
        <>
          {summary?.sampleOnly ? (
            <p className="settings-page__hint">
              지금 있는 기록 {summary.records}건 · 고양이 {summary.cats}마리는 앱이 처음에 깔아 둔{' '}
              <strong>예시</strong>예요. 직접 남긴 기록이 생기면 그때 챙기면 돼요.
            </p>
          ) : (
            <>
              <p className="backup-panel__meta">
                {summary
                  ? `기록 ${summary.records}건 · 고양이 ${summary.cats}마리 · 사진 ${summary.photos}장 · 약 ${formatBytes(summary.bytes)}`
                  : '내보낼 내용을 확인하는 중이에요…'}
              </p>
              <p className="settings-page__hint">
                사진까지 파일 하나에 담아요. 다른 기기나 새 브라우저에서 이 파일로 되돌릴 수 있어요.
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              void handlePick(event.target.files?.[0]);
              // 같은 파일을 다시 고를 수 있게 값을 비운다
              event.target.value = '';
            }}
          />

          <div className="backup-panel__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void handleExport()}
              disabled={busy}
            >
              💾 내보내기
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              📂 가져오기
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="backup-panel__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
