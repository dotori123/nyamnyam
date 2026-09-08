/**
 * 저장 전 사진 줄이기.
 *
 * 요즘 폰 사진은 한 장에 3~8MB다. 기록마다 5장씩 쌓으면 IndexedDB가 금방 커지고,
 * 나중에 Firebase Storage로 올릴 때도 업로드 시간과 요금이 그대로 늘어난다.
 * 사료 봉지를 알아볼 정도면 되는 용도라 긴 변 1600px, JPEG 82%면 충분하다.
 *
 * 실패하면(지원 안 되는 브라우저, 깨진 파일) 원본을 그대로 돌려준다.
 * 사진을 못 넣는 것보다 큰 채로 넣는 게 낫다.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;
/** 이 아래는 건드리지 않는다. 재인코딩해봐야 화질만 깎인다 */
const SKIP_UNDER_BYTES = 400 * 1024;

export async function shrinkImage(file: File): Promise<Blob> {
  if (file.size <= SKIP_UNDER_BYTES) return file;

  const bitmap = await decode(file);
  if (!bitmap) return file;

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY);
    });

    // 이미 잘 압축된 사진이면 재인코딩이 오히려 커진다. 그럴 땐 원본을 쓴다
    return blob && blob.size < file.size ? blob : file;
  } finally {
    bitmap.close();
  }
}

/**
 * EXIF 회전 정보를 반영해서 디코딩한다.
 * 아이폰 사진은 센서 방향 그대로 저장되고 회전은 EXIF에만 적혀 있어서,
 * 이걸 빼먹으면 캔버스에 그리는 순간 옆으로 누운 사진이 된다.
 */
async function decode(file: Blob): Promise<ImageBitmap | null> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // 옵션을 모르는 구형 브라우저
    try {
      return await createImageBitmap(file);
    } catch {
      return null;
    }
  }
}

/**
 * 정해진 바이트 수 안에 들어오도록 한 번 더 줄인다.
 *
 * Firestore 문서는 1MiB가 한도라 사진을 base64로 담으려면 원본이 700KB 남짓이어야 한다.
 * 저장용 축소(긴 변 1600px)를 거쳤어도 결이 복잡한 사진은 이 선을 넘을 수 있어서,
 * 화질을 조금씩 낮춰 가며 맞춘다. 끝내 못 맞추면 null — 그 사진은 이 기기에만 남는다.
 */
export async function shrinkToBytes(blob: Blob, maxBytes: number): Promise<Blob | null> {
  if (blob.size <= maxBytes) return blob;

  const bitmap = await decode(blob);
  if (!bitmap) return null;

  try {
    // 화질을 먼저 낮추고, 그래도 안 되면 크기를 줄인다 (해상도보다 화질이 덜 아쉽다)
    for (const [maxEdge, quality] of [
      [1600, 0.7],
      [1280, 0.65],
      [1024, 0.6],
      [800, 0.55],
    ] as const) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);

      const context = canvas.getContext('2d');
      if (!context) return null;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const candidate = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });
      if (candidate && candidate.size <= maxBytes) return candidate;
    }
    return null;
  } finally {
    bitmap.close();
  }
}

/** Blob → data URL. 업로드용 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('사진을 읽지 못했어요.'));
    reader.readAsDataURL(blob);
  });
}
