/**
 * localStorage에 JSON을 넣고 빼는 얇은 층.
 *
 * 시크릿 모드·용량 초과·저장소 차단 등으로 언제든 실패할 수 있어서
 * 모든 접근을 try/catch로 감싸고, 실패하면 "저장된 게 없다"로 취급한다.
 * (저장이 막혀도 그 세션 동안은 메모리 상태로 정상 동작한다)
 *
 * 사진 원본은 여기 두지 않는다. localStorage는 5MB 남짓이라 금방 터진다.
 * → 사진 Blob은 IndexedDB(src/storage/photos.ts), 여기엔 메타데이터만.
 */

/** 키에 버전을 붙여 뒀다. 저장 구조가 바뀌면 v2로 올리면 옛 데이터가 자동으로 무시된다 */
export const STORAGE_KEYS = {
  records: 'nyamnyam.records.v1',
  cats: 'nyamnyam.cats.v1',
  selectedCat: 'nyamnyam.selectedCat.v1',
} as const;

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    // 접근 차단이거나 저장된 JSON이 깨졌다. 둘 다 "없음"으로 본다
    return null;
  }
}

/** 저장된 배열 읽기. 값이 없거나 배열이 아니면 null (구버전·손상 데이터 방어) */
export function readArray<T>(key: string): T[] | null {
  const value = readJson<unknown>(key);
  return Array.isArray(value) ? (value as T[]) : null;
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과 또는 접근 차단. 화면 동작에는 영향이 없어 조용히 넘어간다
  }
}

/**
 * 저장된 앱 데이터를 전부 지운다 (설정 → 기록 전체 지우기).
 *
 * 키를 **지우지 않고 빈 배열을 쓴다.** 지워 버리면 "저장된 게 없다"가 되어
 * 다음 실행에 샘플 데이터가 다시 깔린다 — 비우려고 누른 사람에게는 안 지워진 것과 같다.
 * 빈 배열은 "비어 있는 상태를 사용자가 선택했다"는 뜻이라 그대로 유지된다.
 *
 * 털색 테마는 다른 키라 남는다 — 데이터를 지운다고 앱 색까지 바뀌면 당황스럽다.
 * 사진 원본은 IndexedDB에 있어 clearPhotoBlobs가 따로 지운다.
 */
export function clearStoredData(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.records, '[]');
    localStorage.setItem(STORAGE_KEYS.cats, '[]');
    localStorage.setItem(STORAGE_KEYS.selectedCat, 'null');
  } catch {
    // 접근이 막혀 있으면 애초에 저장된 것도 없다
  }
}
