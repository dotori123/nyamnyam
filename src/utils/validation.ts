/**
 * 폼 입력 검사.
 *
 * 규칙 하나: **조용히 버리지 않는다.**
 * 예전에는 가격 칸에 "abc"를 넣으면 숫자가 아니라는 이유로 null(또는 0)이 되어
 * 아무 말 없이 저장됐다. 사용자는 값을 넣었다고 생각하는데 기록에는 없는 상태가 된다.
 * 읽을 수 없으면 저장하지 말고 왜 안 되는지 알려준다.
 */

export interface NumberField {
  /** 비었으면 null (선택 입력) */
  value: number | null;
  /** 있으면 저장을 막고 이 문구를 보여준다 */
  error?: string;
}

/**
 * 선택 입력 숫자 칸.
 * "12,900원", "400 g", "4.2kg"처럼 사람이 쓰는 대로 넣어도 받아들인다.
 */
export function parseOptionalNumber(raw: string, label: string): NumberField {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };

  const cleaned = trimmed.replace(/[,\s]/g, '').replace(/(원|kg|g|ml|개|팩)$/i, '');
  const value = Number(cleaned);

  if (!cleaned || !Number.isFinite(value)) {
    return { value: null, error: `${withParticle(label, '을', '를')} 숫자로 입력해 주세요.` };
  }
  if (value <= 0) {
    return { value: null, error: `${withParticle(label, '은', '는')} 0보다 커야 해요.` };
  }
  return { value };
}

/** <input type="date">에 넣을 오늘 날짜 (max로 걸어 달력에서 미래를 못 고르게 한다) */
export function todayInputValue(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * 미래 날짜인지.
 * max 속성만으로는 부족하다 — 키보드로 직접 타이핑하면 그냥 들어간다.
 */
export function isFutureDate(inputValue: string): boolean {
  return Boolean(inputValue) && inputValue > todayInputValue();
}

/**
 * 오류가 있는 첫 번째 칸으로 포커스를 옮긴다.
 *
 * 화면 아래쪽 칸이 비어 있을 때 저장을 누르면, 메시지는 떴는데
 * 화면에는 아무 변화가 없어서 "왜 저장이 안 되지?"가 된다.
 *
 * @param order 화면에 놓인 순서대로의 input id 목록
 */
export function focusFirstError(order: string[], errors: Record<string, string | undefined>) {
  const targetId = order.find((id) => errors[id]);
  if (!targetId) return;

  const field = document.getElementById(targetId);
  if (!field) return;

  field.scrollIntoView({ block: 'center' });
  // 스크롤은 위에서 이미 맞췄다
  field.focus({ preventScroll: true });
}

/** 오류 문구의 id. aria-describedby로 입력칸과 이어 준다 */
export function errorId(fieldId: string): string {
  return `${fieldId}-error`;
}

/**
 * 받침에 맞는 조사를 붙인다 (가격을 / 용량을 / 몸무게를).
 * "가격을(를)" 같은 표기는 읽기 불편해서 직접 고른다.
 */
function withParticle(word: string, withBatchim: string, withoutBatchim: string): string {
  const code = word.charCodeAt(word.length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasBatchim = isHangul && (code - 0xac00) % 28 !== 0;
  return word + (hasBatchim ? withBatchim : withoutBatchim);
}
