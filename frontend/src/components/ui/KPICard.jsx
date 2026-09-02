import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'positive', // 'positive' | 'negative' | 'neutral'
  badgeText,
  badgeVariant = 'brand', // 'brand' | 'success' | 'warning' | 'danger'
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-card animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-700 rounded w-24"></div>
          <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-8 bg-slate-700 rounded w-36 mb-2"></div>
        <div className="h-3 bg-slate-700 rounded w-28"></div>
      </div>
    );
  }

  const badgeColors = {
    brand: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="bg-slate-800/80 dark:bg-slate-800/80 light:bg-white border border-slate-700/60 light:border-slate-200 rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-brand-500/40 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 light:text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-700/50 light:bg-slate-100 text-brand-400 group-hover:scale-105 transition-transform">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <div className="text-2xl font-bold tracking-tight text-white light:text-slate-900">
          {value}
        </div>
        {badgeText && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeColors[badgeVariant]}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-500 mt-2 pt-2 border-t border-slate-700/30 light:border-slate-100">
        <span className="truncate">{subtitle}</span>
        {trend && (
          <div className={`flex items-center space-x-1 font-medium ${
            trendType === 'positive' ? 'text-emerald-400' : trendType === 'negative' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {trendType === 'positive' ? <TrendingUp className="w-3 h-3" /> : trendType === 'negative' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
