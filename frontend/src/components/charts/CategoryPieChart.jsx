import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export const CategoryPieChart = ({ data = [], height = 320 }) => {
  const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-lg text-xs space-y-1">
          <p className="font-semibold text-white">{item.category}</p>
          <p className="text-brand-400 font-medium">
            Revenue: ${Number(item.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-slate-400">
            Units Sold: {Number(item.units_sold).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total_revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;
