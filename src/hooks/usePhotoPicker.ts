import { useCallback, useEffect, useRef, useState } from 'react';
import type { Photo } from '../types';
import { createId } from '../utils/id';
import { shrinkImage } from '../utils/image';
import { putPhotoBlob } from '../storage/photos';

export const MAX_PHOTOS = 5;
/** 고양이 프로필처럼 사진이 1장만 필요한 화면에서 쓴다 */
export const MAX_PROFILE_PHOTOS = 1;

/**
 * 사진 선택 상태 + blob URL 수명 관리.
 *
 * 화면에 쓰는 주소는 URL.createObjectURL()이 만든 blob URL이고,
 * 파일은 고르는 즉시 화면용 크기로 줄여서(utils/image.ts) IndexedDB에 넣어 둔다.
 * blob URL은 탭을 닫으면 죽지만 저장해 둔 사진이 남아 다음에 열 때 되살아난다.
 *
 * 미리보기와 저장본이 같은 Blob이라, 화면에서 괜찮아 보이면 저장된 것도 괜찮다.
 *
 * 폼을 취소해서 버려진 원본은 여기서 지우지 않는다.
 * 다음 실행 때 prunePhotoBlobs가 참조되지 않는 것을 한 번에 치운다.
 *
 * Firebase Storage 연동 시:
 *   1. 선택 시점에 File 객체를 함께 보관하고
 *   2. 저장 시 uploadBytes → getDownloadURL 결과로 photo.url / photo.storagePath를 채운 뒤
 *   3. 업로드가 끝나면 blob URL을 revoke 한다.
 * (자리: src/firebase/storage.ts)
 *
 * @param initialPhotos 수정 모드일 때의 기존 사진
 * @param max           최대 장수 (프로필 사진은 1장)
 */
export function usePhotoPicker(initialPhotos: Photo[] = [], max: number = MAX_PHOTOS) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  /** 이 훅이 만들었고 아직 소유 중인 blob URL. 여기 남은 것만 회수 대상 */
  const ownedUrls = useRef(new Set<string>());
  /** 렌더 중 side effect를 피하려고 최신 photos를 ref로 미러링 */
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const revoke = (url: string) => {
    if (ownedUrls.current.delete(url)) URL.revokeObjectURL(url);
  };

  /** 줄이는 동안 잠깐 걸린다. 버튼을 잠그고 안내를 띄우는 데 쓴다 */
  const [busy, setBusy] = useState(false);

  const addFiles = useCallback(
    async (fileList: FileList | null, source: Photo['source']) => {
      const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'));
      if (!files.length) return;

      const room = max - photosRef.current.length;
      if (room <= 0) return;

      setBusy(true);
      try {
        // 한 장씩 처리해 먼저 끝난 사진부터 화면에 붙인다
        for (const file of files.slice(0, room)) {
          const blob = await shrinkImage(file);

          const url = URL.createObjectURL(blob);
          ownedUrls.current.add(url);

          const id = createId('photo');
          // 저장해 둬야 새로고침 후에도 사진이 보인다
          putPhotoBlob(id, blob);

          const next = [
            ...photosRef.current,
            { id, url, storagePath: null, source, fileName: file.name },
          ];
          photosRef.current = next;
          setPhotos(next);
        }
      } finally {
        setBusy(false);
      }
    },
    [max],
  );

  const removePhoto = useCallback((id: string) => {
    const target = photosRef.current.find((photo) => photo.id === id);
    if (target) revoke(target.url);
    const next = photosRef.current.filter((photo) => photo.id !== id);
    photosRef.current = next;
    setPhotos(next);
  }, []);

  /**
   * 저장 완료 — blob URL 소유권을 저장된 기록으로 넘긴다.
   * 소유 목록을 비우면 unmount 시 회수 대상에서 빠진다.
   */
  const commit = useCallback(() => {
    ownedUrls.current.clear();
  }, []);

  // unmount 시 아직 소유 중인(=저장되지 않은) 미리보기 URL 회수
  useEffect(() => {
    const urls = ownedUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  return {
    photos,
    addFiles,
    removePhoto,
    commit,
    busy,
    max,
    isFull: photos.length >= max,
  };
}
