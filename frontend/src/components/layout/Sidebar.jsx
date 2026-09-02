import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Layers,
  CalendarDays,
  ShieldCheck,
  Lightbulb,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/forecast',
      label: 'Sales Forecast',
      icon: TrendingUp,
      badge: '90% CI',
    },
    {
      to: '/inventory',
      label: 'Inventory Optimizer',
      icon: Boxes,
      badge: 'Simulation',
    },
    {
      to: '/product-detail',
      label: 'SKU Drill-Down',
      icon: Layers,
      badge: null,
    },
    {
      to: '/seasonality',
      label: 'Seasonality & EDA',
      icon: CalendarDays,
      badge: null,
    },
    {
      to: '/data-quality',
      label: 'Data Quality & Pipeline',
      icon: ShieldCheck,
      badge: '0 Nulls',
    },
    {
      to: '/insights',
      label: 'Business Insights',
      icon: Lightbulb,
      badge: 'Actions',
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-glow flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight truncate">
                  RetailPulse AI
                </span>
                <span className="text-[10px] text-brand-400 font-medium tracking-wide uppercase">
                  Demand & Inventory
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {!isCollapsed ? 'Navigation' : '•'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                      } ${!isCollapsed ? 'mr-3' : 'mx-auto'}`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-brand-500/20 text-brand-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Version */}
      <div className="p-3 border-t border-slate-800">
        {!isCollapsed ? (
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
              <span>ML Engine Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              XGBoost + Ridge + Random Forest with TimeSeriesCV
            </p>
          </div>
        ) : (
          <div className="w-3 h-3 mx-auto rounded-full bg-emerald-400" title="Engine Active" />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
