import { createContext } from 'react';
import type { Cat, NewCat } from '../types';

export interface CatsContextValue {
  cats: Cat[];
  /** Firestore 연동 후 로딩 스피너를 붙일 자리 */
  loading: boolean;
  /** 서버에서 못 불러왔을 때의 안내 문구 (로그인 중에만) */
  syncError: string | null;
  getCat: (id: string | null) => Cat | undefined;
  addCat: (input: NewCat) => Cat;
  updateCat: (id: string, patch: Partial<NewCat>) => void;
  removeCat: (id: string) => void;

  /**
   * 현재 선택된(활성) 고양이.
   * 기록 등록 폼의 기본값으로 쓰인다. 등록된 고양이가 없으면 null.
   */
  selectedCatId: string | null;
  selectCat: (id: string | null) => void;
  selectedCat: Cat | undefined;
}

export const CatsContext = createContext<CatsContextValue | null>(null);
