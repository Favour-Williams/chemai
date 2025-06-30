import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useTheme() {
  const { theme, updateTheme } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    if (theme.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystemTheme = () => {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      applySystemTheme();
      mediaQuery.addEventListener('change', applySystemTheme);
      
      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    } else {
      if (theme.mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme.mode]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply primary color with more comprehensive color mapping
    const colorMap = {
      blue: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryDark: '#1d4ed8',
        primaryLight: '#93c5fd'
      },
      purple: {
        primary: '#a855f7',
        primaryHover: '#9333ea',
        primaryDark: '#7c3aed',
        primaryLight: '#c4b5fd'
      },
      green: {
        primary: '#10b981',
        primaryHover: '#059669',
        primaryDark: '#047857',
        primaryLight: '#6ee7b7'
      },
      red: {
        primary: '#ef4444',
        primaryHover: '#dc2626',
        primaryDark: '#b91c1c',
        primaryLight: '#fca5a5'
      },
      orange: {
        primary: '#f97316',
        primaryHover: '#ea580c',
        primaryDark: '#c2410c',
        primaryLight: '#fdba74'
      },
      pink: {
        primary: '#ec4899',
        primaryHover: '#db2777',
        primaryDark: '#be185d',
        primaryLight: '#f9a8d4'
      }
    };

    const colors = colorMap[theme.primaryColor];
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-light', colors.primaryLight);

    // Force a repaint to ensure changes are applied
    root.style.display = 'none';
    root.offsetHeight; // Trigger reflow
    root.style.display = '';
  }, [theme.primaryColor]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };

    root.style.setProperty('--font-size-base', fontSizeMap[theme.fontSize]);
    root.style.fontSize = fontSizeMap[theme.fontSize];
  }, [theme.fontSize]);

  return { theme, updateTheme };
}