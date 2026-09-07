/**
 * 냥냠냠(NyamNyam) — 고양이 프로필 도메인 타입
 *
 * ⚠️ 이 파일의 인터페이스는 그대로 Firestore 문서 구조가 됩니다.
 *   users/{uid}/cats/{catId} → Cat
 *
 * 설계 규칙은 record.ts와 동일합니다.
 *  - 중첩 배열 금지 / `undefined` 대신 `null`
 *  - 날짜는 ISO 8601 문자열, 저장 시 converter가 Timestamp로 변환
 */

import type { IsoDateString } from './record';
import type { Photo } from './photo';

/** 성별 */
export type CatGender = 'male' | 'female' | 'unknown';

/**
 * 고양이 프로필 1마리.
 * → Firestore: users/{uid}/cats/{id}
 */
export interface Cat {
  /** Firestore 문서 ID와 동일하게 유지한다 */
  id: string;

  name: string;
  /** 프로필 사진 1장. 미등록이면 null */
  photo: Photo | null;
  /** 생일 ISO. 나이는 이 값에서 계산한다 (utils/format.ts의 formatAge) */
  birthday: IsoDateString | null;
  /** 품종. 예: 코리안숏헤어 */
  breed: string;
  gender: CatGender;
  /** 체중(kg). 선택 입력이므로 미입력 시 null */
  weightKg: number | null;
  /** 특이사항 (알레르기, 지병, 식성 등) */
  memo: string;

  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * 프로필 폼에서 다루는 값.
 * 숫자·날짜 입력을 문자열로 들고 있다가 저장 시점에 파싱한다
 * (빈 문자열 ↔ null 구분을 위해).
 */
export interface CatFormValues {
  name: string;
  photo: Photo | null;
  /** <input type="date">의 yyyy-MM-dd */
  birthday: string;
  breed: string;
  gender: CatGender;
  weightKg: string;
  memo: string;
}

/** 새 프로필 생성 시 서버가 채우는 필드를 뺀 입력값 */
export type NewCat = Omit<Cat, 'id' | 'createdAt' | 'updatedAt'>;
