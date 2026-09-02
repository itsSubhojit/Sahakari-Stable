import React, { useState } from 'react';

export const Avatar = ({
  src,
  alt = 'Avatar',
  size = 'md',
  isOnline,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`${
          sizeStyles[size] || sizeStyles.md
        } rounded-lg md:rounded-xl overflow-hidden bg-surface-container-high border-2 border-surface-container-high flex items-center justify-center`}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-bold text-primary">{getInitials(alt)}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full ring-2 ring-surface ${
            isOnline ? 'bg-indigo-600' : 'bg-outline'
          }`}
        />
      )}
    </div>
  );
};

