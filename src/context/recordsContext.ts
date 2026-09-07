import { createContext } from 'react';
import type { FeedRecord, NewFeedRecord } from '../types';

export interface RecordsContextValue {
  records: FeedRecord[];
  /** Firestore 연동 후 로딩 스피너를 붙일 자리 */
  loading: boolean;
  /** 서버에서 못 불러왔을 때의 안내 문구 (로그인 중에만) */
  syncError: string | null;
  getRecord: (id: string) => FeedRecord | undefined;
  addRecord: (input: NewFeedRecord) => FeedRecord;
  updateRecord: (id: string, patch: Partial<NewFeedRecord>) => void;
  removeRecord: (id: string) => void;
  /** 등록된 기록에서 뽑아낸 브랜드 목록 (필터용) */
  brands: string[];
  /** 등록된 기록에서 뽑아낸 맛 목록 (필터용) */
  flavors: string[];
}

export const RecordsContext = createContext<RecordsContextValue | null>(null);
