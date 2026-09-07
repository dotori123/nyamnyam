import { useContext } from 'react';
import { CatsContext, type CatsContextValue } from '../context/catsContext';

export function useCats(): CatsContextValue {
  const context = useContext(CatsContext);
  if (!context) {
    throw new Error('useCats()는 <CatsProvider> 안에서만 사용할 수 있습니다.');
  }
  return context;
}
