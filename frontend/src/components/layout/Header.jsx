import React from 'react';
import { useFilters } from '../../context/FilterContext';
import {
  Store,
  Tag,
  Cpu,
  Sun,
  Moon,
  Clock,
  Percent,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

export const Header = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const {
    store,
    setStore,
    category,
    setCategory,
    model,
    setModel,
    leadTime,
    setLeadTime,
    serviceLevel,
    setServiceLevel,
    isDark,
    toggleTheme,
    metadata,
    loadingMetadata,
  } = useFilters();

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur-md border-b border-slate-800 light:border-slate-200 px-6 flex items-center justify-between transition-colors">
      {/* Left: Quick Filters (Store, Category, Model) */}
      <div className="flex items-center space-x-3 overflow-x-auto py-2">
        {/* Store Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 light:text-slate-700">
          <Store className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            disabled={loadingMetadata}
            className="bg-transparent border-none focus:outline-none text-xs font-medium cursor-pointer text-slate-200 light:text-slate-800"
          >
            {metadata.stores.map((s) => (
              <option key={s.id} value={s.name} className="bg-slate-800 light:bg-white text-white light:text-slate-900">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 light:text-slate-700">
          <Tag className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loadingMetadata}
            className="bg-transparent border-none focus:outline-none text-xs font-medium cursor-pointer text-slate-200 light:text-slate-800"
          >
            {metadata.categories.map((c) => (
              <option key={c} value={c} className="bg-slate-800 light:bg-white text-white light:text-slate-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* ML Model Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 light:bg-slate-100 border border-slate-700/60 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 light:text-slate-700">
          <Cpu className="w-3.5 h-3.5 text-brand-400" />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loadingMetadata}
            className="bg-transparent border-none focus:outline-none text-xs font-medium cursor-pointer text-slate-200 light:text-slate-800"
          >
            {metadata.models.map((m) => (
              <option key={m} value={m} className="bg-slate-800 light:bg-white text-white light:text-slate-900">
                {m} {m === metadata.best_model ? '(Optimal)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Simulation Quick Sliders & Theme Toggle */}
      <div className="flex items-center space-x-4 flex-shrink-0">
        {/* Lead Time Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/50 light:bg-slate-100 border border-slate-700/40 light:border-slate-200 rounded-lg px-3 py-1.5 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 light:text-slate-500">Lead Time:</span>
          <span className="font-semibold text-brand-400 light:text-brand-600">{leadTime}d</span>
        </div>

        {/* Service Level Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/50 light:bg-slate-100 border border-slate-700/40 light:border-slate-200 rounded-lg px-3 py-1.5 text-xs">
          <Percent className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 light:text-slate-500">Service Level:</span>
          <span className="font-semibold text-emerald-400 light:text-emerald-600">{serviceLevel}%</span>
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg bg-slate-800 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-white light:hover:text-black border border-slate-700/60 light:border-slate-300 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
