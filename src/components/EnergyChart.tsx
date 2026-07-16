import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { EnergyData } from '../types';

interface EnergyChartProps {
  data: EnergyData;
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

type ViewType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export function EnergyChart({ data, view: externalView, onViewChange }: EnergyChartProps) {
  const [internalView, setInternalView] = useState<ViewType>('daily');
  
  const view = externalView || internalView;
  const setView = onViewChange || setInternalView;

  const chartData = data[view];

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex items-center justify-center sm:justify-end mb-3 sm:mb-4 shrink-0">
        <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          {(['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as ViewType[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                view === v
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              dy={8}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                color: '#f8fafc',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: '600' }}
              formatter={(value: number) => [`${value.toLocaleString()} kWh`, 'Consumption']}
            />
            <Bar dataKey="kwh" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

