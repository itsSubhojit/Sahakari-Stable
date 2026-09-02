import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // default, status, success, warning, primary
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold',
    md: 'text-label-sm px-2.5 py-1 font-semibold',
    lg: 'text-label-md px-3 py-1.5 font-bold',
  };

  const variantStyles = {
    default: 'bg-surface-container-low text-on-surface-variant border border-outline-variant/60',
    status: 'bg-secondary-container/60 text-on-secondary-container tracking-wider uppercase',
    primary: 'bg-primary-fixed text-on-primary-fixed',
    success: 'bg-[#d8f3e5] text-[#003822] border border-[#a1dfbe]',
    warning: 'bg-tertiary-fixed text-on-tertiary-fixed',
    danger: 'bg-error-container text-on-error-container',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
};
