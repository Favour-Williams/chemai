import React, { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAccessibility } from '../hooks/useAccessibility';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useTheme();
  useAccessibility();

  return <>{children}</>;
};

export default ThemeProvider;