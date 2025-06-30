import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height,
  lines = 1,
  className = ''
}) => {
  const isDark = useThemeStore((state) => state.isDark);

  const baseClasses = `
    animate-pulse
    ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
    ${className}
  `;

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'rectangular':
        return 'rounded-lg';
      case 'circular':
        return 'rounded-full';
      case 'card':
        return 'h-48 rounded-xl';
      default:
        return 'h-4 rounded';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} mb-2 last:mb-0`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()}`}
      style={style}
    />
  );
};

export default SkeletonLoader;