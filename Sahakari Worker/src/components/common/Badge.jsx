import React from 'react';

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center font-medium transition-colors';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-sm gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-md gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold rounded-lg gap-2',
    pill: 'px-3 py-1 text-xs font-semibold rounded-full gap-1.5',
  };

  const variantClasses = {
    primary: 'bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim',
    container: 'bg-surface-container-high text-on-surface border border-outline-variant',
    verified: 'bg-primary/10 text-primary border border-primary/20 dark:bg-primary-fixed/20 dark:text-primary-fixed',
    emergency: 'bg-error-container text-on-error-container border border-error/30 animate-pulse',
    success: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/30',
    pending: 'bg-secondary-container text-on-secondary-container border border-secondary/40 font-bold',
    outline: 'bg-transparent text-on-surface-variant border border-outline-variant',
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
    >
      {icon && (
        <span className="material-symbols-outlined text-[16px] leading-none">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};
