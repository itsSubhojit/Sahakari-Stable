import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded gap-1.5',
    md: 'h-11 px-4 text-sm rounded-md gap-2',
    lg: 'h-12 px-6 text-base rounded-md gap-2.5',
    touch: 'h-touch-target px-5 text-sm rounded-md gap-2',
    icon: 'w-10 h-10 rounded-md p-0',
  };

  const variantClasses = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-container focus:ring-primary-container shadow-elevation-1 hover:shadow-elevation-2',
    secondary:
      'bg-surface-container-low text-secondary border-2 border-secondary hover:bg-secondary-container/20 focus:ring-secondary',
    error:
      'bg-error text-on-error hover:bg-error/90 focus:ring-error shadow-elevation-1',
    outline:
      'bg-surface text-on-surface border border-outline-variant hover:bg-surface-container focus:ring-outline',
    ghost:
      'bg-transparent text-on-surface hover:bg-surface-container-high focus:ring-outline-variant',
    tint:
      'bg-surface-tint/15 text-primary hover:bg-surface-tint/25 dark:text-primary-fixed',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      )}
    </button>
  );
};
