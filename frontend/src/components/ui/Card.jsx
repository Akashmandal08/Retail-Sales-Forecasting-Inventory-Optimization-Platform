import React from 'react';

export const Card = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  noPadding = false,
}) => {
  return (
    <div className={`bg-slate-800/90 dark:bg-slate-800/90 light:bg-white border border-slate-700/60 light:border-slate-200 rounded-xl shadow-card transition-colors ${className}`}>
      {(title || subtitle || action) && (
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-700/50 light:border-slate-100 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-base font-semibold text-white light:text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'p-6'} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default Card;
