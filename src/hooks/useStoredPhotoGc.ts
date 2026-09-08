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
 * ## 지우기 전에 반드시 확인하는 것
 *
 * 이 훅은 **사용자 데이터를 영구 삭제**한다. 그래서 "지금 아무것도 없다"와
 * "아직 못 읽었다"를 구분하지 못하면 멀쩡한 사진을 날린다.
 * 실제로 그런 적이 있다 — 로그인 상태에서 앱을 열면 Firestore 첫 스냅샷이
 * 도착하기 전에는 records가 빈 배열이라, 그 순간 청소가 돌아 사진이 전부 지워졌다.
 * (로컬 저장만 쓰던 시절에는 localStorage를 동기로 읽어서 이런 틈이 없었다)
 *
 * 그래서 세 가지를 모두 만족할 때만 지운다.
 *  1. 두 저장소가 **다 읽힌** 뒤 (loading이 끝난 뒤)
 *  2. 불러오기 **오류가 없을 때** (오류면 목록이 비어 보인다)
 *  3. 기록과 프로필이 **하나라도 있을 때**
 *
 * 3번이 있어서 "정말 다 지운 사용자"의 사진 원본은 남을 수 있지만,
 * 그건 설정의 '기록 전체 지우기'가 clearPhotoBlobs로 직접 비운다.
 * 안 지워도 되는 걸 남기는 쪽이, 지우면 안 되는 걸 지우는 쪽보다 낫다.
 */
export function useStoredPhotoGc() {
  const { records, loading: recordsLoading, syncError: recordsError } = useRecords();
  const { cats, loading: catsLoading, syncError: catsError } = useCats();

  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    if (recordsLoading || catsLoading) return;
    if (recordsError || catsError) return;
    // 둘 다 비어 있으면 "없는 것"인지 "못 읽은 것"인지 알 수 없다. 건드리지 않는다
    if (records.length === 0 && cats.length === 0) return;

    done.current = true;

    const keep = new Set<string>();
    records.forEach((record) => record.photos.forEach((photo) => keep.add(photo.id)));
    cats.forEach((cat) => {
      if (cat.photo) keep.add(cat.photo.id);
    });

    void prunePhotoBlobs(keep);
  }, [records, cats, recordsLoading, catsLoading, recordsError, catsError]);
}
