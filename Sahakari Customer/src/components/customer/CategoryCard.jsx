import React from 'react';

export const CategoryCard = ({ category, onClick, selected = false }) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-surface border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50 cursor-pointer flex flex-col justify-between overflow-hidden ${
        selected
          ? 'ring-2 ring-primary border-primary bg-primary-fixed/20'
          : 'border-outline-variant/70 shadow-xs'
      }`}
    >
      {/* Subtle background glow on hover */}
      <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-primary/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors duration-300 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/15 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-xs">
            <span className="material-symbols-outlined text-[26px]">
              {category.icon}
            </span>
          </div>

          {category.popular && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Trending
            </span>
          )}
        </div>

        <div className="mt-4">
          <h3 className="font-display text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-outline-variant/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>{category.activeWorkersCount} pros nearby</span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-on-surface-variant block">From</span>
          <span className="text-sm font-extrabold text-primary font-mono">
            ₹{category.startingPrice}
          </span>
        </div>
      </div>
    </div>
  );
};

