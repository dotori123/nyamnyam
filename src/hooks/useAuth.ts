import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../context/authContext';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth()는 <AuthProvider> 안에서만 사용할 수 있습니다.');
  }
  return context;
}
