import React, { useState, memo, useEffect } from 'react';
import { NavItem } from '../types';
import { Beaker, Moon, Sun, Menu, X } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import AuthModal from './auth/AuthModal';
import UserMenu from './auth/UserMenu';
import ChatInterface from './chat/ChatInterface';
import AccessibleButton from './common/AccessibleButton';
import FocusTrap from './common/FocusTrap';

const Header: React.FC = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; type: 'login' | 'register' }>({
    isOpen: false,
    type: 'login',
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { theme, updateTheme } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();

  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    updateTheme({ mode: newMode });
  };

  // Different navigation items based on authentication status
  const getNavItems = (): NavItem[] => {
    if (isAuthenticated) {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Periodic Table', href: '/periodic-table' },
        { label: 'Reactions', href: '/reaction' },
        { label: 'Chat', href: '#', onClick: () => setIsChatOpen(true) },
      ];
    } else {
      return [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ];
    }
  };

  const navItems = getNavItems();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (item: NavItem) => {
    setIsMenuOpen(false);
    item.onClick?.();
  };

  const handleToggleAuthModalType = (newType: 'login' | 'register') => {
    setAuthModal({ isOpen: true, type: newType });
  };

  // Listen for custom event to open chat
  useEffect(() => {
    const handleOpenChat = () => {
      setIsChatOpen(true);
    };
    
    document.addEventListener('open-chat', handleOpenChat);
    
    return () => {
      document.removeEventListener('open-chat', handleOpenChat);
    };
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 w-full backdrop-blur-sm z-50 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link 
                to={isAuthenticated ? "/dashboard" : "/"} 
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                aria-label="ChemAI Home"
              >
                <Beaker className={`h-8 w-8 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  ChemAI
                </span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={item.onClick}
                  className={`
                    ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} 
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1
                  `}
                >
                  {item.label}
                </Link>
              ))}

              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                ariaLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                icon={isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              />

              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="flex space-x-4">
                  <AccessibleButton
                    variant="primary"
                    size="sm"
                    onClick={() => setAuthModal({ isOpen: true, type: 'login' })}
                  >
                    Sign In
                  </AccessibleButton>
                  <AccessibleButton
                    variant="outline"
                    size="sm"
                    onClick={() => setAuthModal({ isOpen: true, type: 'register' })}
                  >
                    Register
                  </AccessibleButton>
                </div>
              )}
            </nav>

            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={handleMenuToggle}
              className="md:hidden"
              ariaLabel={isMenuOpen ? 'Close menu' : 'Open menu'}
              ariaExpanded={isMenuOpen}
              icon={isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            />
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <FocusTrap active={isMenuOpen}>
            <div className="md:hidden" role="navigation" aria-label="Mobile navigation">
              <div className={`px-2 pt-2 pb-3 space-y-1 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => handleNavClick(item)}
                    className={`
                      block px-3 py-2 rounded-md text-base font-medium transition-colors
                      ${isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <>
                    <AccessibleButton
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setAuthModal({ isOpen: true, type: 'login' });
                        setIsMenuOpen(false);
                      }}
                      className="mt-4"
                    >
                      Sign In
                    </AccessibleButton>
                    <AccessibleButton
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setAuthModal({ isOpen: true, type: 'register' });
                        setIsMenuOpen(false);
                      }}
                      className="mt-2"
                    >
                      Register
                    </AccessibleButton>
                  </>
                )}
              </div>
            </div>
          </FocusTrap>
        )}
      </header>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        type={authModal.type}
        onToggleType={handleToggleAuthModalType}
      />

      {/* Only show chat interface if user is authenticated */}
      {isAuthenticated && (
        <ChatInterface
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </>
  );
});

Header.displayName = 'Header';

export default Header;