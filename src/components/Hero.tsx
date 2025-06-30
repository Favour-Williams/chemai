import React, { memo } from 'react';
import AnimatedCard from './common/AnimatedCard';
import Button from './common/Button';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = memo(() => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-10" />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <AnimatedCard direction="up" delay={0}>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Explore Chemistry with AI
          </h1>
        </AnimatedCard>
        
        <AnimatedCard direction="up" delay={200}>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Discover the fascinating world of chemistry through interactive learning and AI assistance
          </p>
        </AnimatedCard>
        
        <AnimatedCard direction="up" delay={400}>
          <Button
            size="lg"
            icon={<ArrowRight />}
            iconPosition="right"
            className="transform hover:scale-105 transition-transform duration-200"
            aria-label="Get started with ChemAI"
          >
            Get Started
          </Button>
        </AnimatedCard>
      </div>
    </div>
  );
});

Hero.displayName = 'Hero';

export default Hero;