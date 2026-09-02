import React from 'react';

export const Input = ({
  label,
  error,
  icon,
  rightIcon,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-label-md font-medium text-on-surface-variant"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant pointer-events-none text-[20px]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-surface-container-low border ${
            error ? 'border-error ring-1 ring-error' : 'border-outline-variant'
          } rounded-lg ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150 ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="material-symbols-outlined absolute right-3 text-on-surface-variant text-[20px]">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-label-sm text-error mt-0.5">{error}</p>}
    </div>
  );
};
