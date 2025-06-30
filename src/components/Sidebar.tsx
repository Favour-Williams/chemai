import React from 'react';
import { User, UserCircle, LogIn } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const Sidebar: React.FC = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const isLoggedIn = false; // This will be replaced with actual auth state

  return (
    <aside className={`w-64 hidden md:block ${isDark ? 'bg-gray-800' : 'bg-gray-100'} p-4`}>
      <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} p-4 mb-4`}>
        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className={`h-10 w-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
              <div>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Guest User</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>guest@example.com</p>
              </div>
            </div>
            <button className={`w-full py-2 px-4 rounded-lg ${isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserCircle className={`h-10 w-10 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
              <div>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Please sign in</p>
              </div>
            </div>
            <button className={`w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;