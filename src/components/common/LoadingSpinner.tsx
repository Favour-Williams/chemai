import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const isDark = useThemeStore((state) => state.isDark);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`
        animate-spin rounded-full border-2 border-transparent
        ${sizeClasses[size]}
        ${isDark 
          ? 'border-t-blue-400 border-r-blue-400' 
          : 'border-t-blue-600 border-r-blue-600'
        }
      `} />
      {text && (
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;