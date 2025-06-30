import React from 'react';
import { Github, Twitter, Mail } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

const Footer: React.FC = () => {
  const { theme } = useSettingsStore();
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isSystem = theme.mode === 'system';

  return (
    <footer className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>ChemAI</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Explore chemistry with the power of artificial intelligence.
            </p>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Features</h3>
            <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>Periodic Table</li>
              <li>AI Chat</li>
              <li>3D Simulations</li>
            </ul>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resources</h3>
            <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>Documentation</li>
              <li>API</li>
              <li>Support</li>
            </ul>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
        <div className={`mt-8 pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 md:mb-0`}>
              © {new Date().getFullYear()} ChemAI. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6">
              {/* Bolt.new Badge */}
              <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                {isSystem ? (
                  <img 
                    src="/logotext_poweredby_360w.png" 
                    alt="Powered by Bolt.new" 
                    className="h-10 w-auto"
                  />
                ) : (
                  <>
                    <img 
                      src="/white_circle_360x360.png" 
                      alt="Powered by Bolt.new" 
                      className="h-10 w-10 dark:block hidden"
                    />
                    <img 
                      src="/black_circle_360x360.png" 
                      alt="Powered by Bolt.new" 
                      className="h-10 w-10 dark:hidden block"
                    />
                  </>
                )}
              </a>
              
              {/* ElevenLabs Badge */}
              <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                {isSystem ? (
                  <img 
                    src="/wordmark-color.svg" 
                    alt="Powered by ElevenLabs" 
                    className="h-8"
                  />
                ) : (
                  <>
                    <img 
                      src="/wordmark-white.svg" 
                      alt="Powered by ElevenLabs" 
                      className="h-8 dark:block hidden"
                    />
                    <img 
                      src="/wordmark-black.svg" 
                      alt="Powered by ElevenLabs" 
                      className="h-8 dark:hidden block"
                    />
                  </>
                )}
              </a>
              
              {/* Supabase Badge */}
              <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                {isSystem ? (
                  <img 
                    src="/wordmark-color (1).svg" 
                    alt="Powered by Supabase" 
                    className="h-8"
                  />
                ) : (
                  <>
                    <img 
                      src="/wordmark-white (1).svg" 
                      alt="Powered by Supabase" 
                      className="h-8 dark:block hidden"
                    />
                    <img 
                      src="/wordmark-black (1).svg" 
                      alt="Powered by Supabase" 
                      className="h-8 dark:hidden block"
                    />
                  </>
                )}
              </a>
              
              {/* Netlify Badge */}
              <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                {isSystem ? (
                  <img 
                    src="/wordmark-color (2).svg" 
                    alt="Powered by Netlify" 
                    className="h-8"
                  />
                ) : (
                  <>
                    <img 
                      src="/wordmark-white (2).svg" 
                      alt="Powered by Netlify" 
                      className="h-8 dark:block hidden"
                    />
                    <img 
                      src="/wordmark-black (2).svg" 
                      alt="Powered by Netlify" 
                      className="h-8 dark:hidden block"
                    />
                  </>
                )}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;