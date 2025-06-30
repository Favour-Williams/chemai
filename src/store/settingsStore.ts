import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink';
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    layout: 'comfortable' | 'compact';
  };
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    reactions: boolean;
    updates: boolean;
    marketing: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  };
  account: {
    twoFactor: boolean;
    dataSharing: boolean;
    analytics: boolean;
  };
}

interface SettingsStore extends SettingsState {
  updateTheme: (theme: Partial<SettingsState['theme']>) => void;
  updateLanguage: (language: string) => void;
  updateNotifications: (notifications: Partial<SettingsState['notifications']>) => void;
  updateAccessibility: (accessibility: Partial<SettingsState['accessibility']>) => void;
  updateAccount: (account: Partial<SettingsState['account']>) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  theme: {
    mode: 'dark',
    primaryColor: 'blue',
    fontSize: 'medium',
    layout: 'comfortable'
  },
  language: 'en',
  notifications: {
    email: true,
    push: true,
    reactions: true,
    updates: false,
    marketing: false
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    fontSize: 'medium'
  },
  account: {
    twoFactor: false,
    dataSharing: true,
    analytics: true
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      updateTheme: (theme) => set((state) => ({
        theme: { ...state.theme, ...theme }
      })),
      
      updateLanguage: (language) => set({ language }),
      
      updateNotifications: (notifications) => set((state) => ({
        notifications: { ...state.notifications, ...notifications }
      })),
      
      updateAccessibility: (accessibility) => set((state) => ({
        accessibility: { ...state.accessibility, ...accessibility }
      })),
      
      updateAccount: (account) => set((state) => ({
        account: { ...state.account, ...account }
      })),
      
      resetSettings: () => set(defaultSettings)
    }),
    {
      name: 'chemai-settings',
      version: 1
    }
  )
);