import { useContext } from 'react';
import { RecordsContext, type RecordsContextValue } from '../context/recordsContext';

export function useRecords(): RecordsContextValue {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords()는 <RecordsProvider> 안에서만 사용할 수 있습니다.');
  }
  return context;
}
