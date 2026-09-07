/**
 * 로컬 ID 생성기.
 * Firestore 연동 후에는 `doc(collection(db, ...)).id`로 대체하면 된다.
 */
export function createId(prefix = 'rec'): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
