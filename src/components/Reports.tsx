import React, { useState, useMemo } from 'react';
import { ACUnit, EnergyData } from '../types';
import { EnergyChart } from './EnergyChart';
import { Filter, MapPin, Download, Activity, Zap } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { useAppContext } from '../context/AppContext';

interface ReportsProps {
  units: ACUnit[];
}

export function Reports({ units }: ReportsProps) {
  const { venues } = useAppContext();
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('All');

  const locationOptions = useMemo(() => {
    const venueIds = new Set(units.map((u) => u.venueId));
    return [
      { value: 'All', label: 'All Locations' },
      ...Array.from(venueIds).map((id) => ({
        value: id,
        label: venues.find((v) => v.id === id)?.name || id,
      })),
    ];
  }, [units, venues]);

  const unitOptions = useMemo(() => {
    const filtered = units.filter(
      (u) => selectedLocation === 'All' || u.venueId === selectedLocation
    );
    return [
      { value: 'All', label: 'All Units' },
      ...filtered.map((u) => ({ value: u.id, label: u.name })),
    ];
  }, [units, selectedLocation]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchLocation =
        selectedLocation === 'All' || unit.venueId === selectedLocation;
      const matchUnit = selectedUnitId === 'All' || unit.id === selectedUnitId;
      return matchLocation && matchUnit;
    });
  }, [units, selectedLocation, selectedUnitId]);

  const aggregatedData = useMemo(() => {
    const result: EnergyData = {
      hourly: [],
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };

    if (filteredUnits.length === 0) return result;

    const firstUnit = filteredUnits[0];
    (['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const).forEach((period) => {
      if (firstUnit.energyConsumption[period]) {
        result[period] = firstUnit.energyConsumption[period].map((item) => ({
          label: item.label,
          kwh: 0,
        }));
      }
    });

    filteredUnits.forEach((unit) => {
      (['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const).forEach((period) => {
        if (unit.energyConsumption[period]) {
          unit.energyConsumption[period].forEach((item, index) => {
            if (result[period]?.[index]) {
              result[period][index].kwh += item.kwh;
            }
          });
        }
      });
    });

    return result;
  }, [filteredUnits]);

  const totalConsumption = useMemo(() => {
    if (!aggregatedData.monthly || aggregatedData.monthly.length === 0) return 0;
    return aggregatedData.monthly[aggregatedData.monthly.length - 1].kwh;
  }, [aggregatedData]);

  const dailyAverage = useMemo(() => {
    const daily = aggregatedData.daily;
    if (!daily || daily.length === 0) return 0;
    const sum = daily.reduce((acc, d) => acc + d.kwh, 0);
    return sum / daily.length;
  }, [aggregatedData]);

  const handleDownload = () => {
    const headers = ['Period', 'Label', 'Energy (kWh)'];
    const rows: string[] = [];

    (['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const).forEach((period) => {
      if (aggregatedData[period]) {
        aggregatedData[period].forEach((item) => {
          rows.push(`${period},${item.label},${item.kwh.toFixed(2)}`);
        });
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `energy_report_${selectedLocation}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-slate-50/15 select-none p-4 md:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 mb-4 md:mb-5">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span className="truncate">Energy Reports</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-semibold">
            Detailed energy consumption analysis
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-blue-600/15 active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      {/* Main card — page never scrolls; this card does when needed */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Filters + stats */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)_minmax(0,0.65fr)] gap-3 md:gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">
                Filters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Location
                  </label>
                  <CustomDropdown
                    value={selectedLocation}
                    onChange={(v) => {
                      setSelectedLocation(v);
                      setSelectedUnitId('All');
                    }}
                    options={locationOptions}
                    placement="down"
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-500" />
                    Unit
                  </label>
                  <CustomDropdown
                    value={selectedUnitId}
                    onChange={setSelectedUnitId}
                    options={unitOptions}
                    placement="down"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 fill-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Month Total
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {totalConsumption.toLocaleString()}
                <span className="text-sm font-bold text-slate-400 ml-1.5">kWh</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Daily Avg
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                {dailyAverage.toFixed(1)}
                <span className="text-sm font-bold text-slate-400 ml-1.5">kWh</span>
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 md:p-5 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3 md:mb-4">
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                  Consumption Chart
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {filteredUnits.length} unit{filteredUnits.length === 1 ? '' : 's'} selected
                </p>
              </div>
            </div>

            {filteredUnits.length > 0 ? (
              <div className="w-full h-[240px] sm:h-[280px] md:h-[340px] lg:h-[380px]">
                <EnergyChart data={aggregatedData} />
              </div>
            ) : (
              <div className="h-[200px] sm:h-[240px] flex flex-col items-center justify-center text-center px-4">
                <Activity className="w-10 h-10 text-slate-300 mb-3" />
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                  No Data Available
                </span>
                <p className="text-xs text-slate-400 font-semibold max-w-[220px]">
                  No units match your current location or unit filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
