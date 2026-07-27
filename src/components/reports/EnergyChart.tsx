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
import { EnergyData } from '../../types';

interface EnergyChartProps {
  data: EnergyData;
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

type ViewType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const VIEW_LABELS: Record<ViewType, string> = {
  hourly: 'Hour',
  daily: 'Day',
  weekly: 'Week',
  monthly: 'Month',
  yearly: 'Year',
};

export function EnergyChart({ data, view: externalView, onViewChange }: EnergyChartProps) {
  const [internalView, setInternalView] = useState<ViewType>('daily');

  const view = externalView || internalView;
  const setView = onViewChange || setInternalView;

  const chartData = Array.isArray(data?.[view]) ? data[view] : [];
  const totalKwh = chartData.reduce((sum, row) => sum + (Number(row.kwh) || 0), 0);

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-3">
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0 px-1">
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 tabular-nums">
          Total{' '}
          <span className="text-slate-800 font-black">
            {totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh
          </span>
        </p>
        <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide gap-0.5">
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
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[220px] sm:min-h-[260px] w-full relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              No energy data for this period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                dy={6}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                width={36}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 600 }}
                labelStyle={{ color: '#94a3b8', marginBottom: 4, fontWeight: 700 }}
                formatter={(value: number) => [
                  `${Number(value).toLocaleString()} kWh`,
                  'Consumption',
                ]}
              />
              <Bar
                dataKey="kwh"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
