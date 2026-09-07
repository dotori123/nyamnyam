import { createContext } from 'react';
import type { ThemeId, ThemeOption } from '../types';

export interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeOption;
  setTheme: (id: ThemeId) => void;
  options: ThemeOption[];
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
