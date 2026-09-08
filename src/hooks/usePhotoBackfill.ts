import { useEffect, useRef } from 'react';
import { readAllPhotoBlobs } from '../storage/photos';
import { blobToDataUrl, shrinkToBytes } from '../utils/image';
import { MAX_PHOTO_DATA_LENGTH, uploadPhoto } from '../firebase/photos';
import { useRecords } from './useRecords';
import { useCats } from './useCats';
import { useAuth } from './useAuth';

/**
 * 이 기기에만 있는 사진을 계정으로 올려 둔다.
 *
 * 사진 동기화가 붙기 전에 올린 사진들은 이 기기의 IndexedDB에만 있다.
 * 그대로 두면 다른 기기에서는 영영 사진 없는 기록으로 보인다.
 * 그래서 앱을 열 때 한 번, **기록이 참조하는데 아직 계정에 없는** 사진을 올린다.
 *
 * 조용히 뒤에서 한다 — 사용자가 뭘 눌러야 하는 일이 아니고,
 * 실패해도 이 기기에서는 그대로 보이므로 알릴 것도 없다.
 *
 * 이미 올라간 사진을 다시 올리지 않으려고, 올린 id를 이 기기에 적어 둔다.
 */

const UPLOADED_KEY = 'nyamnyam.photosUploaded';

function readUploaded(): Set<string> {
  try {
    const raw = localStorage.getItem(UPLOADED_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function rememberUploaded(ids: Set<string>): void {
  try {
    localStorage.setItem(UPLOADED_KEY, JSON.stringify([...ids]));
  } catch {
    // 못 적으면 다음에 또 올린다. 같은 id로 덮어써서 중복은 생기지 않는다
  }
}

export function usePhotoBackfill() {
  const { user } = useAuth();
  const { records, loading: recordsLoading } = useRecords();
  const { cats, loading: catsLoading } = useCats();

  const done = useRef(false);
  useEffect(() => {
    const uid = user?.uid;
    if (!uid || done.current) return;
    // 목록을 다 읽기 전에는 무엇이 참조되는지 알 수 없다
    if (recordsLoading || catsLoading) return;

    done.current = true;

    void (async () => {
      const referenced = new Set<string>();
      records.forEach((record) => record.photos.forEach((photo) => referenced.add(photo.id)));
      cats.forEach((cat) => {
        if (cat.photo) referenced.add(cat.photo.id);
      });
      if (referenced.size === 0) return;

      const uploaded = readUploaded();
      const stored = await readAllPhotoBlobs();

      for (const [id, blob] of stored) {
        if (!referenced.has(id) || uploaded.has(id)) continue;

        try {
          const fitted = await shrinkToBytes(blob, Math.floor(MAX_PHOTO_DATA_LENGTH * 0.72));
          if (fitted && (await uploadPhoto(uid, id, await blobToDataUrl(fitted)))) {
            uploaded.add(id);
          }
        } catch {
          // 이 사진만 건너뛴다
        }
      }

      rememberUploaded(uploaded);
    })();
  }, [user, records, cats, recordsLoading, catsLoading]);
}
