import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

export const PromoImpactBarChart = ({ data = [], height = 280 }) => {
  const COLORS = {
    'Holiday & Promo': '#f472b6',
    'Promo Only': '#38bdf8',
    'Holiday Only': '#818cf8',
    'Regular Day': '#64748b',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-white">{item.type}</p>
          <p className="text-brand-400 font-medium">
            Avg Daily Sales: <span className="text-white font-bold">{item.avg_units} units</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
          <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="avg_units" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.type] || '#38bdf8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PromoImpactBarChart;
