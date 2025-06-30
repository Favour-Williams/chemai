import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useSettingsStore } from '../store/settingsStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useSettingsStore();
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${theme.layout === 'compact' ? 'layout-compact' : ''}`}>
      <Header />
      <div className="flex pt-16">
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;