import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useAccessibility() {
  const { accessibility } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [accessibility.highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply reduced motion
    if (accessibility.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [accessibility.reducedMotion]);

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply screen reader optimizations
    if (accessibility.screenReader) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
  }, [accessibility.screenReader]);

  return { accessibility };
}