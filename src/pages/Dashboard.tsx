import React, { memo, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { 
  Beaker, 
  MessageSquare, 
  Video, 
  AlertTriangle, 
  Clock, 
  Search,
  Star,
  TrendingUp
} from 'lucide-react';
import AnimatedCard from '../components/common/AnimatedCard';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = memo(() => {
  const { user } = useAuthStore();
  const { theme } = useSettingsStore();
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isSystem = theme.mode === 'system';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userStats, setUserStats] = useState({
    reactionsExplored: 0,
    aiConversations: 0,
    safetyWarnings: 0
  });
  const [recentReactions, setRecentReactions] = useState<any[]>([]);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch reaction count
        const { count: reactionsCount, error: reactionsError } = await supabase
          .from('reactions')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id);
          
        if (reactionsError) throw reactionsError;
        
        // Fetch conversation count
        const { count: conversationsCount, error: conversationsError } = await supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (conversationsError) throw conversationsError;
        
        // Fetch safety warnings count (from reactions with safety warnings)
        const { count: safetyCount, error: safetyError } = await supabase
          .from('reactions')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .not('safety_warnings', 'is', null)
          .gt('safety_warnings', '{}');
          
        if (safetyError) throw safetyError;
        
        // Fetch recent reactions
        const { data: recentReactionsData, error: recentError } = await supabase
          .from('reactions')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (recentError) throw recentError;
        
        // Update state with fetched data
        setUserStats({
          reactionsExplored: reactionsCount || 0,
          aiConversations: conversationsCount || 0,
          safetyWarnings: safetyCount || 0
        });
        
        // Format recent reactions
        const formattedReactions = (recentReactionsData || []).map(reaction => ({
          reaction: reaction.equation,
          name: reaction.name,
          safety: reaction.safety_warnings?.length > 0 ? 'Caution' : 'Safe',
          time: formatTimeAgo(new Date(reaction.created_at))
        }));
        
        setRecentReactions(formattedReactions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err as Error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-center p-8 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Failed to load dashboard
          </h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatedCard direction="fade" className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.name}!
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Explore chemical reactions and get AI-powered insights
          </p>
        </AnimatedCard>

        {/* Quick Stats with Chibi Characters */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {/* Left Chibi */}
          <div className="hidden lg:block w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-full animate-float">
            <img 
              src="/chibi-chemist.jfif" // Adjust path as needed
              alt="Chibi Chemist" 
              className="w-full h-full object-cover" // object-cover ensures image fills the circular space
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 flex-grow">
            {loading ? (
              Array.from({ length: 2 }).map((_, index) => ( 
                <SkeletonLoader key={index} variant="card" />
              ))
            ) : (
              [
                {
                  title: "Reactions Explored",
                  value: userStats.reactionsExplored.toString(),
                  icon: <Beaker className="h-6 w-6 text-blue-500" />,
                  description: "Total reactions viewed"
                },
                {
                  title: "AI Conversations",
                  value: userStats.aiConversations.toString(),
                  icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
                  description: "Chemistry Q&A sessions"
                }
              ].map((stat, index) => (
                <AnimatedCard
                  key={stat.title}
                  delay={index * 100}
                  direction="up"
                >
                  <DashboardCard {...stat} />
                </AnimatedCard>
              ))
            )}
          </div>

          {/* Right Chibi */}
          <div className="hidden lg:block w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-full animate-float">
            <img 
              src="/chibi.jpg" // Adjust path as needed
              alt="Chibi AI Robot" 
              className="w-full h-full object-cover" // object-cover ensures image fills the circular space
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Reactions */}
          <AnimatedCard delay={400} direction="left">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Recent Reactions
                </h2>
                <Clock className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <SkeletonLoader variant="text" width="60%" />
                      <SkeletonLoader variant="text" width="80%" />
                      <SkeletonLoader variant="text" width="40%" />
                    </div>
                  ))
                ) : recentReactions.length > 0 ? (
                  recentReactions.map((item, index) => (
                    <div
                      key={index}
                      className={`
                        p-4 rounded-md border cursor-pointer hover:shadow-md transition-all
                        ${isDark 
                          ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.safety === 'Safe' 
                            ? 'bg-green-100 text-green-800' 
                            : item.safety === 'Dangerous'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.safety}
                        </span>
                      </div>
                      <p className={`text-sm font-mono ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        {item.reaction}
                      </p>
                      <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Beaker className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reactions created yet</p>
                    <p className="text-sm mt-2">Create your first reaction from the Reaction page</p>
                  </div>
                )}
              </div>
            </div>
          </AnimatedCard>

          {/* Quick Actions */}
          <AnimatedCard delay={600} direction="right">
            <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link to="/reaction">
                  <ActionButton
                    icon={<Search className="h-5 w-5" />}
                    title="Explore New Reaction"
                    description="Search for chemical reactions to simulate"
                    isDark={isDark}
                  />
                </Link>
                <button onClick={() => document.dispatchEvent(new CustomEvent('open-chat'))}>
                  <ActionButton
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="Ask Chemistry AI"
                    description="Get instant answers to chemistry questions"
                    isDark={isDark}
                  />
                </button>
                <Link to="/periodic-table">
                  <ActionButton
                    icon={<Beaker className="h-5 w-5" />}
                    title="Browse Periodic Table"
                    description="Explore element properties and interactions"
                    isDark={isDark}
                  />
                </Link>
              </div>
            </div>
          </AnimatedCard>
        </div>
        
        {/* Badges Section */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
          {/* Bolt.new Badge */}
          <a href="https://bolt.new" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
            {isSystem ? (
              <img 
                src="/logotext_poweredby_360w.png" 
                alt="Powered by Bolt.new" 
                className="h-10"
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
    </div>
  );
});

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}

const DashboardCard: React.FC<DashboardCardProps> = memo(({ title, value, icon, description }) => {
  const { theme } = useSettingsStore();
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className={`
      p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300
      ${isDark ? 'bg-gray-800' : 'bg-white'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        {icon}
      </div>
      <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>
      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{description}</p>
    </div>
  );
});

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDark: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = memo(({ icon, title, description, isDark }) => {
  return (
    <div className={`
      w-full p-4 rounded-lg border text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
      ${isDark 
        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650 hover:border-gray-500' 
        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      }
    `}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-md ${
          isDark ? 'bg-gray-600 text-blue-300' : 'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
        <div>
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';
DashboardCard.displayName = 'DashboardCard';
ActionButton.displayName = 'ActionButton';

export default Dashboard;