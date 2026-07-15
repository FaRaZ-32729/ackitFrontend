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
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-end mb-4">
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {(['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
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
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
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
            <Bar dataKey="kwh" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

