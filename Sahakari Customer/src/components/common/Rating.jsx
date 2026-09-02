import React from 'react';

export const Rating = ({
  score = 5.0,
  reviewsCount,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-lg border border-outline-variant/40 ${className}`}
    >
      <span className="material-symbols-outlined fill text-secondary text-sm">
        star
      </span>
      <span className="font-label-md font-semibold text-on-surface">
        {Number(score).toFixed(1)}
      </span>
      {showCount && reviewsCount && (
        <span className="text-label-sm text-on-surface-variant font-normal">
          ({reviewsCount})
        </span>
      )}
    </div>
  );
};
