import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useThemeStore } from '../../store/themeStore';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  hover = true
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  });
  const isDark = useThemeStore((state) => state.isDark);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all duration-700 ease-out';
    
    if (!isIntersecting) {
      switch (direction) {
        case 'up':
          return `${baseClasses} opacity-0 translate-y-8`;
        case 'down':
          return `${baseClasses} opacity-0 -translate-y-8`;
        case 'left':
          return `${baseClasses} opacity-0 translate-x-8`;
        case 'right':
          return `${baseClasses} opacity-0 -translate-x-8`;
        case 'fade':
          return `${baseClasses} opacity-0`;
        default:
          return `${baseClasses} opacity-0 translate-y-8`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-x-0 translate-y-0`;
  };

  const hoverClasses = hover 
    ? 'hover:scale-105 hover:shadow-xl transform transition-all duration-300' 
    : '';

  return (
    <div
      ref={ref}
      className={`
        ${getAnimationClasses()}
        ${hoverClasses}
        ${className}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;