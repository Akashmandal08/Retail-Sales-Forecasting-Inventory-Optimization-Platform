import React from 'react';

export const Slider = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  helpText,
  icon: Icon
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-slate-300 light:text-slate-700 flex items-center space-x-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-brand-400" />}
          <span>{label}</span>
        </label>
        <span className="font-semibold text-brand-400 light:text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded text-xs">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-700 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500 focus:outline-none"
      />

      <div className="flex justify-between text-[10px] text-slate-400 light:text-slate-400">
        <span>{min} {unit}</span>
        {helpText && <span className="text-slate-400">{helpText}</span>}
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};

export default Slider;
