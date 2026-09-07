/**
 * 기록과 고양이 프로필이 함께 쓰는 사진 타입.
 *
 * 지금은 URL.createObjectURL()로 만든 로컬 blob URL이 `url`에 들어간다.
 * Firebase 연동 후에는 Storage 업로드 → downloadURL을 `url`에,
 * Storage 경로를 `storagePath`에 넣는다. (삭제 시 storagePath 필요)
 */
export interface Photo {
  id: string;
  /** 표시용 URL (mock: blob URL / 실서비스: Storage downloadURL) */
  url: string;
  /**
   * Storage 경로.
   *  - 기록:     `users/{uid}/records/{recordId}/{photoId}.jpg`
   *  - 고양이:   `users/{uid}/cats/{catId}/{photoId}.jpg`
   */
  storagePath: string | null;
  /** 어디서 왔는지 — 카메라 촬영 / 앨범 선택 */
  source: 'camera' | 'library';
  /** 원본 파일명 (있을 때만) */
  fileName: string | null;
}
