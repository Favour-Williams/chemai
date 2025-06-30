import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-primary text-white hover:bg-primary-hover 
      focus:ring-primary active:bg-primary-dark
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-gray-600 text-white hover:bg-gray-700 
      focus:ring-gray-500 active:bg-gray-800
      shadow-sm hover:shadow-md
    `,
    outline: `
      border-2 border-primary text-primary hover:bg-primary hover:text-white
      focus:ring-primary active:bg-primary-dark active:text-white
      dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-white
    `,
    ghost: `
      text-gray-700 hover:bg-gray-100 focus:ring-gray-500
      dark:text-gray-300 dark:hover:bg-gray-800
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700 
      focus:ring-red-500 active:bg-red-800
      shadow-sm hover:shadow-md
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />;
    }
    if (icon) {
      return React.cloneElement(icon as React.ReactElement, {
        className: iconSizeClasses[size]
      });
    }
    return null;
  };

  return (
    <button
      ref={ref}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;