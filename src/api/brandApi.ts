import api from './axios';

export interface BrandSignalsPayload {
  powerOn: string | null;
  powerOff: string | null;
  temperatures: Record<number, string | null>;
  fanSpeeds: {
    low: string | null;
    medium: string | null;
    high: string | null;
    ultra: string | null;
    turbo: string | null;
  };
  modes: {
    cool: string | null;
    heat: string | null;
    dry: string | null;
    fan: string | null;
    auto: string | null;
  };
}

export interface ApiBrand {
  _id: string;
  configureId: string;
  brandName: string;
  powerCommands?: { on?: string; off?: string };
  modes?: {
    cool?: string;
    heat?: string;
    dry?: string;
    fanOnly?: string;
    smartAuto?: string;
  };
  temperatureCommands?: Record<string, string>;
  fanSpeedCommands?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

const TEMP_WORD_BY_C: Record<number, string> = {
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
  21: 'twentyOne',
  22: 'twentyTwo',
  23: 'twentyThree',
  24: 'twentyFour',
  25: 'twentyFive',
  26: 'twentySix',
  27: 'twentySeven',
  28: 'twentyEight',
  29: 'twentyNine',
  30: 'thirty',
};

export function mapApiBrandToSignals(brand: ApiBrand): BrandSignalsPayload {
  const temperatures: Record<number, string | null> = {};
  for (let c = 16; c <= 30; c += 1) {
    const word = TEMP_WORD_BY_C[c];
    const value = brand.temperatureCommands?.[word] || '';
    temperatures[c] = value || null;
  }

  return {
    powerOn: brand.powerCommands?.on || null,
    powerOff: brand.powerCommands?.off || null,
    temperatures,
    fanSpeeds: {
      low: brand.fanSpeedCommands?.low || null,
      medium: brand.fanSpeedCommands?.medium || null,
      high: brand.fanSpeedCommands?.high || null,
      ultra: brand.fanSpeedCommands?.ultra || null,
      turbo: brand.fanSpeedCommands?.turbo || null,
    },
    modes: {
      cool: brand.modes?.cool || null,
      heat: brand.modes?.heat || null,
      dry: brand.modes?.dry || null,
      fan: brand.modes?.fanOnly || null,
      auto: brand.modes?.smartAuto || null,
    },
  };
}

export async function createConfigureId(): Promise<string> {
  const { data } = await api.post<{ success: boolean; configureId: string; message?: string }>(
    '/api/brand/configure'
  );
  if (!data.success || !data.configureId) {
    throw new Error(data.message || 'Failed to generate configure code');
  }
  return data.configureId;
}

export async function selectBrandCommand(configureId: string, command: string) {
  const { data } = await api.post<{ success: boolean; message?: string }>('/api/brand/select-command', {
    configureId,
    command,
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to select command');
  }
  return data;
}

export async function clearBrandCommand(configureId: string, command: string) {
  const { data } = await api.post<{ success: boolean; message?: string }>('/api/brand/clear-command', {
    configureId,
    command,
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to clear command');
  }
  return data;
}

export async function applyBrandCommand(configureId: string, command: string) {
  const { data } = await api.post<{ success: boolean; message?: string; value?: string }>(
    '/api/brand/apply',
    { configureId, command }
  );
  if (!data.success) {
    throw new Error(data.message || 'Failed to apply command');
  }
  return data;
}

export function signalsToCommands(signals: BrandSignalsPayload): Record<string, string> {
  const commands: Record<string, string> = {};

  if (signals.powerOn) commands['power.on'] = signals.powerOn;
  if (signals.powerOff) commands['power.off'] = signals.powerOff;

  for (const [key, value] of Object.entries(signals.modes || {})) {
    if (value) commands[`mode.${key}`] = value;
  }

  for (const [temp, value] of Object.entries(signals.temperatures || {})) {
    if (value) commands[`temp.${temp}`] = value;
  }

  for (const [key, value] of Object.entries(signals.fanSpeeds || {})) {
    if (value) commands[`fan.${key}`] = value;
  }

  return commands;
}

export async function saveBrand(payload: {
  configureId: string;
  brandName: string;
  signals: BrandSignalsPayload;
}) {
  const commands = signalsToCommands(payload.signals);

  const { data } = await api.post<{
    success: boolean;
    brand: ApiBrand;
    message?: string;
    errors?: Array<{ field: string; message: string }>;
  }>('/api/brand/save', {
    configureId: payload.configureId,
    brandName: payload.brandName,
    commands,
    // nested + signals kept for compatibility / debugging
    signals: payload.signals,
  });

  if (!data.success) {
    const detail = data.errors?.map((e) => e.message).join('; ');
    throw new Error(detail || data.message || 'Failed to save brand');
  }
  return data.brand;
}

export async function getAllBrands(): Promise<ApiBrand[]> {
  const { data } = await api.get<{ success: boolean; brands: ApiBrand[] }>('/api/brand/all');
  return data.brands || [];
}

export async function deleteBrand(id: string) {
  await api.delete(`/api/brand/${id}`);
}
