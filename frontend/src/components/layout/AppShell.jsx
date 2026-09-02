import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export const AppShell = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-900 light:bg-slate-50 text-slate-100 light:text-slate-800 transition-colors">
      {/* Fixed Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} flex flex-col min-h-screen`}>
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>

        <footer className="py-4 px-8 border-t border-slate-800/80 light:border-slate-200 text-center text-xs text-slate-400 light:text-slate-400">
          Retail Sales Forecasting & Dynamic Inventory Optimization Platform • Built with React, Vite & Python ML
        </footer>
      </div>
    </div>
  );
};

export default AppShell;
