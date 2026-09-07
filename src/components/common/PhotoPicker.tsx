import { useRef, type ChangeEvent } from 'react';
import type { Photo } from '../../types';
import { MAX_PHOTOS } from '../../hooks/usePhotoPicker';
import './PhotoPicker.scss';

interface Props {
  photos: Photo[];
  onAddFiles: (files: FileList | null, source: Photo['source']) => void;
  onRemove: (id: string) => void;
  isFull: boolean;
  /** 고른 사진을 줄이는 중 */
  busy?: boolean;
  /** 최대 장수. 고양이 프로필 사진처럼 1장만 받을 때 넘긴다 */
  max?: number;
  /** 하단 안내 문구를 덮어쓰고 싶을 때 */
  hint?: string;
}

/**
 * 카메라 촬영 / 앨범 선택을 각각 별도의 file input으로 분리한다.
 *  - 카메라: capture="environment" → 모바일에서 후면 카메라가 바로 열림
 *  - 앨범:   capture 없음 + multiple → 갤러리에서 여러 장 선택
 * 데스크톱 브라우저는 capture를 무시하고 일반 파일 선택창을 띄운다.
 *
 * 기록(최대 5장)과 고양이 프로필(1장)이 함께 쓴다.
 */
export default function PhotoPicker({
  photos,
  onAddFiles,
  onRemove,
  isFull,
  busy = false,
  max = MAX_PHOTOS,
  hint,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const isSingle = max === 1;

  const handleChange = (source: Photo['source']) => (event: ChangeEvent<HTMLInputElement>) => {
    onAddFiles(event.target.files, source);
    // 같은 파일을 연속으로 다시 고를 수 있도록 값을 비운다
    event.target.value = '';
  };

  const defaultHint = isFull
    ? isSingle
      ? '사진을 바꾸려면 ✕로 지우고 다시 선택해 주세요.'
      : `사진은 최대 ${max}장까지 등록할 수 있어요.`
    : `${photos.length} / ${max}장 · 이 기기에만 저장돼요.`;

  // 줄이는 동안에는 진행 상태가 안내보다 먼저다
  const shownHint = busy ? '사진을 줄이는 중이에요…' : (hint ?? defaultHint);

  return (
    <div className="photo-picker">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleChange('camera')}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        multiple={!isSingle}
        className="sr-only"
        onChange={handleChange('library')}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="photo-picker__actions">
        <button
          type="button"
          className="btn btn--ghost photo-picker__action"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isFull || busy}
        >
          📷 촬영하기
        </button>
        <button
          type="button"
          className="btn btn--ghost photo-picker__action"
          onClick={() => albumInputRef.current?.click()}
          disabled={isFull || busy}
        >
          🖼️ 앨범에서 선택
        </button>
      </div>

      {photos.length > 0 && (
        <ul className="photo-picker__list">
          {photos.filter((photo) => photo.url).map((photo) => (
            <li
              key={photo.id}
              className={
                isSingle ? 'photo-picker__item photo-picker__item--single' : 'photo-picker__item'
              }
            >
              <img
                src={photo.url}
                alt={photo.fileName ?? '선택한 사진'}
                className="photo-picker__image"
              />
              <span className="photo-picker__source">
                {photo.source === 'camera' ? '📷' : '🖼️'}
              </span>
              <button
                type="button"
                className="photo-picker__remove"
                onClick={() => onRemove(photo.id)}
                aria-label="사진 삭제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 줄이는 동안 바뀌는 문구라 스크린리더에도 알린다 */}
      <p className="field__hint" aria-live="polite">
        {shownHint}
      </p>
    </div>
  );
}
