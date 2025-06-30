import React, { forwardRef } from 'react';
import Button from './Button';

interface AccessibleButtonProps extends React.ComponentProps<typeof Button> {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  role?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  role,
  children,
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      role={role}
      {...props}
    >
      {children}
    </Button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;