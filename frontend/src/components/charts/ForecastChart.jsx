import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const ForecastChart = ({ data = [], height = 380, modelName = 'XGBoost' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-slate-400 text-xs">
        No forecast data available for the selected filters.
      </div>
    );
  }

  // Pre-process data for prediction interval area (upper_bound, interval_base: lower_bound, interval_span: upper_bound - lower_bound)
  const chartData = data.map((d) => ({
    ...d,
    dateFormatted: d.date.length > 5 ? d.date.substring(5) : d.date,
    intervalSpan: Math.max(0, Number((d.upper_bound - d.lower_bound).toFixed(2))),
    intervalBase: d.lower_bound,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1 z-50">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1">
            Date: {pData.date}
          </p>
          <div className="flex items-center justify-between space-x-4">
            <span className="text-brand-400 font-medium">Actual Demand:</span>
            <span className="font-bold text-white">{pData.actual} units</span>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span className="text-rose-400 font-medium">{modelName} Forecast:</span>
            <span className="font-bold text-white">{pData.forecast} units</span>
          </div>
          <div className="flex items-center justify-between space-x-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>90% Prediction Interval:</span>
            <span className="font-mono text-slate-300">[{pData.lower_bound} – {pData.upper_bound}]</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="predictionIntervalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
          <XAxis
            dataKey="dateFormatted"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Units Demand', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, dy: 40 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
          />

          {/* Shaded Area for Prediction Interval */}
          <Area
            type="monotone"
            dataKey="upper_bound"
            stroke="none"
            fill="url(#predictionIntervalGradient)"
            name="90% Prediction Interval"
          />

          {/* Actual Sales Line */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual Sales"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#38bdf8', strokeWidth: 2, fill: '#0f172a' }}
          />

          {/* Forecast Sales Line */}
          <Line
            type="monotone"
            dataKey="forecast"
            name={`${modelName} Forecast`}
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, stroke: '#f43f5e', strokeWidth: 2, fill: '#0f172a' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastChart;
