/**
 * 사진 업로드 자리.
 *
 * 흐름:
 *   1. usePhotoPicker가 들고 있는 File을 uploadBytes로 올린다
 *      경로: `users/{uid}/records/{recordId}/{photoId}.jpg`
 *   2. getDownloadURL 결과를 RecordPhoto.url에,
 *      경로를 RecordPhoto.storagePath에 저장한다
 *   3. 업로드가 끝나면 URL.revokeObjectURL로 blob URL을 회수한다
 *
 * 업로드 전에 canvas로 리사이즈/압축하는 단계를 넣으면 좋다.
 */

export {};
