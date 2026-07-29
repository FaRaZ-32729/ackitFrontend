import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Building2,
  MapPin,
  Download,
  Activity,
  Zap,
  MonitorSmartphone,
  RefreshCw,
} from 'lucide-react';
import { CustomDropdown } from '../ui/CustomDropdown';
import { useAppContext } from '../../context/AppContext';
import { getDevicesByVenue } from '../../api/deviceApi';
import {
  getDeviceEnergy,
  type DeviceEnergyRow,
  type EnergyPeriod,
} from '../../api/energyApi';
import type { Organization, Venue } from '../../types';

type PeriodView = EnergyPeriod;

const PERIOD_TABS: { id: PeriodView; label: string }[] = [
  { id: 'hourly', label: 'Hour' },
  { id: 'daily', label: 'Day' },
  { id: 'weekly', label: 'Week' },
  { id: 'monthly', label: 'Month' },
  { id: 'yearly', label: 'Year' },
];

function escapeCsv(value: string | number): string {
  const raw = String(value ?? '');
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/**
 * Energy Reports — API only (no MQTT / websocket / AppContext device state).
 *
 * Flow:
 *  1) User picks Organization + Venue
 *  2) GET /api/device/by-venue/:venueId → device ids
 *  3) GET /api/device/energy?deviceIds=&period= → units (energyConsumptionCalc) + power
 *  4) Table shows Device / Org / Venue / Units / Power for the active period tab
 *  5) Download CSV exports exactly that visible table
 *
 * Optional `orgs` / `venues` props scope filters (sub-users: assigned only).
 */
export function Reports({
  orgs: orgsProp,
  venues: venuesProp,
}: {
  orgs?: Organization[];
  venues?: Venue[];
} = {}) {
  const {
    orgs: contextOrgs,
    venues: contextVenues,
    fetchMyVenues,
    venuesLoading,
    authLoading,
    role,
    user,
  } = useAppContext();

  // Sub-users: only assigned organizations / venues (from props or auth user)
  const orgs = useMemo(() => {
    if (orgsProp) return orgsProp;
    if (role === 'user') {
      const ids = user?.organizationIds || [];
      if (ids.length === 0) return [];
      return contextOrgs.filter((o) => ids.includes(o.id));
    }
    return contextOrgs;
  }, [orgsProp, contextOrgs, role, user?.organizationIds]);

  const venues = useMemo(() => {
    if (venuesProp) return venuesProp;
    if (role === 'user') {
      const ids = user?.assignedVenueIds || [];
      if (ids.length === 0) return [];
      return contextVenues.filter((v) => ids.includes(v.id));
    }
    return contextVenues;
  }, [venuesProp, contextVenues, role, user?.assignedVenueIds]);

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [periodView, setPeriodView] = useState<PeriodView>('daily');

  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  const [deviceRows, setDeviceRows] = useState<DeviceEnergyRow[]>([]);
  const [monthTotalKwh, setMonthTotalKwh] = useState(0);
  const [dailyAverageKwh, setDailyAverageKwh] = useState(0);
  const [loadingEnergy, setLoadingEnergy] = useState(false);
  const [energyError, setEnergyError] = useState<string | null>(null);

  // Managers load full org/venue tree. Sub-users rely on assigned lists
  // (hydrated from /me + optional props) — do not overwrite with all-org venues.
  useEffect(() => {
    if (authLoading) return;
    if (role === 'user' || orgsProp || venuesProp) return;
    void fetchMyVenues().catch(() => {});
  }, [authLoading, fetchMyVenues, role, orgsProp, venuesProp]);

  // Default: first organization once list is available
  useEffect(() => {
    if (!orgs.length) return;
    setSelectedOrgId((prev) =>
      prev && orgs.some((o) => o.id === prev) ? prev : orgs[0].id
    );
  }, [orgs]);

  const orgVenues = useMemo(
    () => venues.filter((v) => v.orgId === selectedOrgId),
    [venues, selectedOrgId]
  );

  // Default: first venue under selected organization
  useEffect(() => {
    if (!selectedOrgId) return;
    if (!orgVenues.length) {
      if (!venuesLoading) setSelectedVenueId('');
      return;
    }
    setSelectedVenueId((prev) =>
      prev && orgVenues.some((v) => v.id === prev) ? prev : orgVenues[0].id
    );
  }, [orgVenues, selectedOrgId, venuesLoading]);

  const orgOptions = useMemo(
    () => orgs.map((o) => ({ value: o.id, label: o.name })),
    [orgs]
  );

  const venueOptions = useMemo(
    () => orgVenues.map((v) => ({ value: v.id, label: v.name })),
    [orgVenues]
  );

  const selectedOrgName = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId)?.name || 'Organization',
    [orgs, selectedOrgId]
  );

  const selectedVenueName = useMemo(
    () => orgVenues.find((v) => v.id === selectedVenueId)?.name || 'Venue',
    [orgVenues, selectedVenueId]
  );

  const periodLabel =
    PERIOD_TABS.find((t) => t.id === periodView)?.label || periodView;

  // Step 2: load all device ids for the selected venue (REST only)
  useEffect(() => {
    let cancelled = false;

    async function loadVenueDeviceIds() {
      if (!selectedVenueId) {
        setDeviceIds([]);
        setDevicesError(null);
        setLoadingDevices(false);
        return;
      }

      setLoadingDevices(true);
      setDevicesError(null);
      try {
        const list = await getDevicesByVenue(selectedVenueId);
        if (cancelled) return;
        setDeviceIds(list.map((d) => d.id).filter(Boolean));
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load venue devices:', err);
        setDeviceIds([]);
        setDevicesError('Could not load devices for this venue');
      } finally {
        if (!cancelled) setLoadingDevices(false);
      }
    }

    void loadVenueDeviceIds();
    return () => {
      cancelled = true;
    };
  }, [selectedVenueId]);

  const deviceIdsKey = deviceIds.join(',');

  // Step 3: calculate units + power for active period tab
  useEffect(() => {
    let cancelled = false;
    const ids = deviceIdsKey ? deviceIdsKey.split(',') : [];

    async function loadEnergy() {
      if (ids.length === 0) {
        setDeviceRows([]);
        setEnergyError(null);
        setLoadingEnergy(false);
        return;
      }

      setLoadingEnergy(true);
      setEnergyError(null);
      try {
        const res = await getDeviceEnergy(ids, periodView);
        if (cancelled) return;
        setDeviceRows(Array.isArray(res.devices) ? res.devices : []);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load energy rows:', err);
        setEnergyError('Could not load consumption data');
        setDeviceRows([]);
      } finally {
        if (!cancelled) setLoadingEnergy(false);
      }
    }

    void loadEnergy();
    return () => {
      cancelled = true;
    };
  }, [deviceIdsKey, periodView]);

  // Month total + daily average cards (same venue devices, monthly window)
  useEffect(() => {
    let cancelled = false;
    const ids = deviceIdsKey ? deviceIdsKey.split(',') : [];

    async function loadMonthStats() {
      if (ids.length === 0) {
        setMonthTotalKwh(0);
        setDailyAverageKwh(0);
        return;
      }

      try {
        const res = await getDeviceEnergy(ids, 'monthly');
        if (cancelled) return;
        const total = Number(res.totalKwh) || 0;
        const days = Math.max(1, res.series?.length || 30);
        setMonthTotalKwh(total);
        setDailyAverageKwh(total / days);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load monthly energy stats:', err);
        setMonthTotalKwh(0);
        setDailyAverageKwh(0);
      }
    }

    void loadMonthStats();
    return () => {
      cancelled = true;
    };
  }, [deviceIdsKey]);

  const periodTotalKwh = useMemo(
    () => deviceRows.reduce((sum, r) => sum + (Number(r.unitsKwh) || 0), 0),
    [deviceRows]
  );

  /** Export the table currently on screen (org + venue + period tab). */
  const handleDownload = useCallback(() => {
    if (deviceRows.length === 0) return;

    const headers = [
      'Device',
      'Organization',
      'Venue',
      'Units (kWh)',
      'Power (W)',
    ];

    const lines = [
      headers.map(escapeCsv).join(','),
      ...deviceRows.map((row) =>
        [
          row.deviceName,
          row.organizationName || selectedOrgName,
          row.venueName || selectedVenueName,
          Number(row.unitsKwh || 0).toFixed(4),
          Number(row.powerW || 0).toFixed(2),
        ]
          .map(escapeCsv)
          .join(',')
      ),
      // Totals row matching what the user sees for this tab
      [
        'TOTAL',
        selectedOrgName,
        selectedVenueName,
        periodTotalKwh.toFixed(4),
        '',
      ]
        .map(escapeCsv)
        .join(','),
    ];

    // BOM so Excel opens UTF-8 correctly
    const csvContent = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeOrg = selectedOrgName.replace(/[^\w\-]+/g, '_');
    const safeVenue = selectedVenueName.replace(/[^\w\-]+/g, '_');
    const date = new Date().toISOString().split('T')[0];

    link.href = url;
    link.download = `energy_${safeOrg}_${safeVenue}_${periodView}_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    deviceRows,
    selectedOrgName,
    selectedVenueName,
    periodLabel,
    periodView,
    periodTotalKwh,
  ]);

  const showTable = !loadingDevices && deviceIds.length > 0;
  const canDownload = !loadingEnergy && deviceRows.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-slate-50/15 select-none p-4 md:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6">
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
          disabled={!canDownload}
          title={
            canDownload
              ? `Download ${periodLabel} report for ${selectedVenueName}`
              : 'Load a venue with energy data first'
          }
          className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-blue-600/15 active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 gap-4 md:gap-5">
          <div className="shrink-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)_minmax(0,0.65fr)] gap-3 md:gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">
                Filters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Organization
                  </label>
                  <CustomDropdown
                    value={selectedOrgId}
                    onChange={(v) => {
                      setSelectedOrgId(v);
                      setSelectedVenueId('');
                    }}
                    options={
                      orgOptions.length
                        ? orgOptions
                        : [
                            {
                              value: '',
                              label: venuesLoading
                                ? 'Loading organizations…'
                                : 'No organizations',
                              disabled: true,
                            },
                          ]
                    }
                    placeholder={
                      venuesLoading ? 'Loading…' : 'Select organization'
                    }
                    placement="down"
                  />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Venue
                  </label>
                  <CustomDropdown
                    value={selectedVenueId}
                    onChange={setSelectedVenueId}
                    options={
                      venueOptions.length
                        ? venueOptions
                        : [
                            {
                              value: '',
                              label: venuesLoading
                                ? 'Loading venues…'
                                : selectedOrgId
                                  ? 'No venues in this organization'
                                  : 'Select organization first',
                              disabled: true,
                            },
                          ]
                    }
                    placeholder={venuesLoading ? 'Loading…' : 'Select venue'}
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
                {monthTotalKwh.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
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
                {dailyAverageKwh.toFixed(1)}
                <span className="text-sm font-bold text-slate-400 ml-1.5">kWh</span>
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 rounded-2xl border border-slate-100 bg-white overflow-hidden flex flex-col">
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                  Consumption Chart
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {deviceIds.length} device{deviceIds.length === 1 ? '' : 's'}
                  {loadingDevices || loadingEnergy ? ' · Loading…' : ''}
                  {!loadingEnergy && deviceRows.length > 0
                    ? ` · ${periodTotalKwh.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} kWh`
                    : ''}
                  {devicesError ? ` · ${devicesError}` : ''}
                  {energyError ? ` · ${energyError}` : ''}
                </p>
              </div>

              <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide gap-0.5 shrink-0">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPeriodView(tab.id)}
                    className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                      periodView === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden px-1 pb-2">
              {loadingDevices ? (
                <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Loading devices…
                  </span>
                </div>
              ) : !selectedOrgId || !selectedVenueId ? (
                <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mb-3" />
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                    Select Filters
                  </span>
                  <p className="text-xs text-slate-400 font-semibold max-w-[220px]">
                    Choose an organization and venue to view device consumption.
                  </p>
                </div>
              ) : devicesError ? (
                <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                  <Activity className="w-12 h-12 text-amber-300 mb-3" />
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest mb-1">
                    {devicesError}
                  </span>
                </div>
              ) : deviceIds.length === 0 ? (
                <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                  <MonitorSmartphone className="w-12 h-12 text-slate-300 mb-3" />
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                    No Devices Found
                  </span>
                  <p className="text-xs text-slate-400 font-semibold max-w-[220px]">
                    No devices registered for this venue yet.
                  </p>
                </div>
              ) : showTable ? (
                <table className="w-full table-fixed border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                    <tr className="border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider text-left">
                      <th className="py-3 pl-4 pr-2 w-[24%]">Device</th>
                      <th className="py-3 px-2 w-[20%] hidden sm:table-cell">
                        Organization
                      </th>
                      <th className="py-3 px-2 w-[18%] hidden md:table-cell">
                        Venue
                      </th>
                      <th className="py-3 px-2 w-[18%] text-right">Units</th>
                      <th className="py-3 pl-2 pr-4 w-[20%] text-right">Power</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                    {(deviceRows.length > 0
                      ? deviceRows
                      : deviceIds.map((id) => ({
                          deviceId: id,
                          deviceName: '…',
                          organizationName: selectedOrgName,
                          venueName: selectedVenueName,
                          unitsKwh: 0,
                          powerW: 0,
                          currentA: 0,
                        }))
                    ).map((row) => (
                      <tr
                        key={row.deviceId}
                        className="hover:bg-slate-50/40 transition-colors"
                      >
                        <td className="py-3.5 pl-4 pr-2 align-middle">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                              <MonitorSmartphone className="w-3.5 h-3.5" />
                            </div>
                            <span
                              className="font-extrabold text-slate-900 truncate min-w-0"
                              title={row.deviceName}
                            >
                              {row.deviceName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 align-middle hidden sm:table-cell">
                          <span
                            className="block truncate text-slate-500 font-semibold"
                            title={row.organizationName || selectedOrgName}
                          >
                            {row.organizationName || selectedOrgName}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 align-middle hidden md:table-cell">
                          <span
                            className="block truncate text-slate-500 font-semibold"
                            title={row.venueName || selectedVenueName}
                          >
                            {row.venueName || selectedVenueName}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 align-middle text-right">
                          <span className="font-black text-slate-900 tabular-nums">
                            {loadingEnergy
                              ? '…'
                              : `${Number(row.unitsKwh).toLocaleString(undefined, {
                                  maximumFractionDigits: 3,
                                })} `}
                          </span>
                          {!loadingEnergy && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              kWh
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pl-2 pr-4 align-middle text-right">
                          <span className="font-black text-slate-900 tabular-nums">
                            {loadingEnergy
                              ? '…'
                              : `${Number(row.powerW).toLocaleString(undefined, {
                                  maximumFractionDigits: 1,
                                })} `}
                          </span>
                          {!loadingEnergy && (
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              W
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
