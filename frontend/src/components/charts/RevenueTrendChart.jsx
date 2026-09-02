import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const RevenueTrendChart = ({ dailyData = [], monthlyData = [], height = 320 }) => {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'monthly'
  const activeData = viewMode === 'daily' ? dailyData : monthlyData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-slate-200">{data.date || data.year_month}</p>
          <p className="text-brand-400 font-medium">
            Revenue: <span className="font-bold text-white">${Number(data.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </p>
          <p className="text-slate-400">
            Units: <span className="font-bold text-slate-200">{Number(data.units_sold).toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <div className="inline-flex rounded-lg bg-slate-900/60 p-0.5 border border-slate-700/60 text-[11px]">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              viewMode === 'monthly'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            <XAxis
              dataKey={viewMode === 'daily' ? 'date' : 'year_month'}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={viewMode === 'daily' ? 'preserveStartEnd' : 0}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total_revenue"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueTrendChart;
