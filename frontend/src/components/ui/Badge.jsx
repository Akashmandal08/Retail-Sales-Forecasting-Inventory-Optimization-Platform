import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const variantClasses = {
    brand: 'bg-brand-500/10 text-brand-400 border border-brand-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
    neutral: 'bg-slate-700/50 text-slate-300 border border-slate-600/40',
  };

  // Aliases for status names
  const aliasVariants = {
    'Healthy': 'emerald',
    'Low Stock': 'rose',
    'Critical': 'rose',
    'CRITICAL': 'rose',
    'Overstocked': 'amber',
    'HIGH': 'amber',
    'High': 'amber',
    'MEDIUM': 'brand',
    'Medium': 'brand',
    'LOW': 'neutral',
  };

  const selectedVariant = aliasVariants[children] || aliasVariants[variant] || variantClasses[variant] ? (aliasVariants[children] || variant) : 'neutral';
  const colorClass = variantClasses[selectedVariant] || variantClasses.neutral;

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${colorClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
