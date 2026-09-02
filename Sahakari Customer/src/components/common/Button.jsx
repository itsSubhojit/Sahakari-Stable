import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-label-sm py-1.5 px-3 gap-1.5',
    md: 'text-label-md py-2.5 px-4 gap-2',
    lg: 'text-body-md py-3 px-6 gap-2.5',
    icon: 'p-2 rounded-full',
  };

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-container focus:ring-primary',
    'primary-container':
      'bg-primary-container text-on-primary-container hover:bg-primary-container/90 focus:ring-primary',
    secondary:
      'bg-secondary text-on-secondary hover:bg-secondary/90 focus:ring-secondary',
    'secondary-container':
      'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90 focus:ring-secondary',
    tint:
      'bg-surface-tint text-on-primary hover:bg-surface-tint/90 focus:ring-surface-tint shadow-sm',
    outline:
      'border border-outline text-on-surface hover:bg-surface-container-high focus:ring-outline',
    ghost:
      'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus:ring-outline-variant',
    danger:
      'bg-error text-on-error hover:bg-error/90 focus:ring-error',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};
