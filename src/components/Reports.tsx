import React, { useState, useMemo } from 'react';
import { ACUnit, EnergyData } from '../types';
import { EnergyChart } from './EnergyChart';
import { Filter, MapPin, Download } from 'lucide-react';

interface ReportsProps {
  units: ACUnit[];
}

export function Reports({ units }: ReportsProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('All');

  const locations = useMemo(() => {
    const locs = new Set(units.map((u) => u.venueId));
    return ['All', ...Array.from(locs)];
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const locString = unit.venueId;
      const matchLocation =
        selectedLocation === 'All' || locString === selectedLocation;
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

    // Initialize with labels from the first unit
    const firstUnit = filteredUnits[0];
    ['hourly', 'daily', 'weekly', 'monthly', 'yearly'].forEach((period) => {
      const p = period as keyof EnergyData;
      if (firstUnit.energyConsumption[p]) {
        result[p] = firstUnit.energyConsumption[p].map((item) => ({
          label: item.label,
          kwh: 0,
        }));
      }
    });

    // Sum up the values
    filteredUnits.forEach((unit) => {
      ['hourly', 'daily', 'weekly', 'monthly', 'yearly'].forEach((period) => {
        const p = period as keyof EnergyData;
        if (unit.energyConsumption[p]) {
          unit.energyConsumption[p].forEach((item, index) => {
            if (result[p] && result[p][index]) {
              result[p][index].kwh += item.kwh;
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

  const handleDownload = () => {
    // Generate CSV content
    const headers = ['Period', 'Label', 'Energy (kWh)'];
    const rows: string[] = [];
    
    ['hourly', 'daily', 'weekly', 'monthly', 'yearly'].forEach((period) => {
      const p = period as keyof EnergyData;
      if (aggregatedData[p]) {
        aggregatedData[p].forEach(item => {
          rows.push(`${period},${item.label},${item.kwh.toFixed(2)}`);
        });
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `energy_report_${selectedLocation}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Energy Reports
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Detailed energy consumption analysis</p>
        </div>
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-[2]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Filter by Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setSelectedUnitId('All');
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                Filter by Unit
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="All">All Units</option>
                {units
                  .filter(
                    (u) =>
                      selectedLocation === 'All' || u.venueId === selectedLocation
                  )
                  .map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          <div className="flex-1 bg-blue-50 rounded-2xl p-4 flex flex-col justify-center border border-blue-100 min-w-[240px]">
            <p className="text-xs font-medium text-blue-800 mb-1 uppercase tracking-wider">Total Consumption (Current Month)</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-900">
              {totalConsumption.toLocaleString()} <span className="text-lg font-medium text-blue-700">kWh</span>
            </p>
          </div>
        </div>

        {filteredUnits.length > 0 ? (
          <div className="w-full">
            <div className="h-[220px] sm:h-[300px] md:h-[400px]">
              <EnergyChart data={aggregatedData} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No data available for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
}
