import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import ReactionCard from '../components/reaction/ReactionCard';
import FloatingReactionButton from '../components/reaction/FloatingReactionButton';
import { useSettingsStore } from '../store/settingsStore';

const Home: React.FC = () => {
  const { theme } = useSettingsStore();
   const isSystem = theme.mode === 'system';
  
  return (
    <main>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Features />
          </div>
          <div>
            <ReactionCard />
          </div>
        </div>
        
        {/* Badges Section */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Bolt.new Badge */}
          <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
            {isSystem ? (
              <img 
                src="/logotext_poweredby_360w.png" 
                alt="Powered by Bolt.new" 
                className="h-16 w-auto"
              />
            ) : (
              <>
                <img 
                  src="/white_circle_360x360.png" 
                  alt="Powered by Bolt.new" 
                  className="h-16 w-16 dark:block hidden"
                />
                <img 
                  src="/black_circle_360x360.png" 
                  alt="Powered by Bolt.new" 
                  className="h-16 w-16 dark:hidden block"
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
                className="h-10"
              />
            ) : (
              <>
                <img 
                  src="/wordmark-white.svg" 
                  alt="Powered by ElevenLabs" 
                  className="h-10 dark:block hidden"
                />
                <img 
                  src="/wordmark-black.svg" 
                  alt="Powered by ElevenLabs" 
                  className="h-10 dark:hidden block"
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
                className="h-10"
              />
            ) : (
              <>
                <img 
                  src="/wordmark-white (1).svg" 
                  alt="Powered by Supabase" 
                  className="h-10 dark:block hidden"
                />
                <img 
                  src="/wordmark-black (1).svg" 
                  alt="Powered by Supabase" 
                  className="h-10 dark:hidden block"
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
                className="h-10"
              />
            ) : (
              <>
                <img 
                  src="/wordmark-white (2).svg" 
                  alt="Powered by Netlify" 
                  className="h-10 dark:block hidden"
                />
                <img 
                  src="/wordmark-black (2).svg" 
                  alt="Powered by Netlify" 
                  className="h-10 dark:hidden block"
                />
              </>
            )}
          </a>
        </div>
      </div>
      <FloatingReactionButton />
    </main>
  );
};

export default Home;