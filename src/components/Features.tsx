import React, { memo } from 'react';
import { FeatureCard } from '../types';
import { AtomIcon, MessageSquare, Cuboid as Cube } from 'lucide-react';
import AnimatedCard from './common/AnimatedCard';
import { useThemeStore } from '../store/themeStore';

const Features: React.FC = memo(() => {
  const isDark = useThemeStore((state) => state.isDark);
  
  const features: FeatureCard[] = [
    {
      title: 'Interactive Periodic Table',
      description: 'Explore elements with detailed information and interactive visualizations',
      icon: 'atom'
    },
    {
      title: 'AI Chemistry Chat',
      description: 'Get instant answers to your chemistry questions from our advanced AI',
      icon: 'chat'
    },
    {
      title: '3D Molecular Simulations',
      description: 'Visualize chemical structures and reactions in immersive 3D',
      icon: 'cube'
    }
  ];

  const getIcon = (iconName: string) => {
    const iconClasses = "h-8 w-8";
    switch (iconName) {
      case 'atom':
        return <AtomIcon className={`${iconClasses} text-blue-500`} />;
      case 'chat':
        return <MessageSquare className={`${iconClasses} text-purple-500`} />;
      case 'cube':
        return <Cube className={`${iconClasses} text-indigo-500`} />;
      default:
        return null;
    }
  };

  return (
    <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedCard direction="fade" className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Discover Our Features
          </h2>
          <p className="text-gray-400 text-lg">
            Powerful tools to enhance your chemistry learning experience
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedCard
              key={index}
              delay={index * 200}
              direction="up"
              className="bg-gray-800 rounded-xl p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className="mb-4">{getIcon(feature.icon)}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
});

Features.displayName = 'Features';

export default Features;