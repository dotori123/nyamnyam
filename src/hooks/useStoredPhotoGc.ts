import { useEffect, useRef } from 'react';
import { prunePhotoBlobs } from '../storage/photos';
import { useRecords } from './useRecords';
import { useCats } from './useCats';

/**
 * 버려진 사진 원본 청소.
 *
 * 폼 취소·사진 삭제·기록 삭제를 각각 추적하는 대신,
 * 앱을 열 때 한 번 "지금 살아있는 사진 id" 전체를 모아
 * 그 목록에 없는 IndexedDB 원본을 지운다.
 *
 * 기록과 프로필을 모두 봐야 해서 두 Provider 안쪽(AppLayout)에서 부른다.
 */
export function useStoredPhotoGc() {
  const { records } = useRecords();
  const { cats } = useCats();

  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const keep = new Set<string>();
    records.forEach((record) => record.photos.forEach((photo) => keep.add(photo.id)));
    cats.forEach((cat) => {
      if (cat.photo) keep.add(cat.photo.id);
    });

    void prunePhotoBlobs(keep);
  }, [records, cats]);
}
