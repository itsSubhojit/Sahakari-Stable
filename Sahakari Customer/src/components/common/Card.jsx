import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'surface', // surface, elevated, container, low, glass
  padding = 'md',
  onClick,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-4 sm:p-5 md:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    surface: 'bg-surface border border-outline-variant/70 rounded-2xl shadow-xs',
    elevated: 'bg-surface border border-outline-variant/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200',
    container: 'bg-surface-container border border-outline-variant/60 rounded-2xl',
    low: 'bg-surface-container-low border border-outline-variant/50 rounded-2xl',
    glass: 'glass-card rounded-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant] || variantStyles.surface} ${
        paddingStyles[padding] || paddingStyles.md
      } ${onClick ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
