import {
  getCoveringEvents,
  ignoreScheduleEvent,
  type CoveringEvent,
} from '../api/eventApi';

export type EventOverridePending = {
  events: CoveringEvent[];
  /** true when changing from org/venue bulk controls */
  ignoreAllTargets: boolean;
  confirm: () => Promise<void>;
  cancel: () => void;
};

/**
 * If any schedule is covering the target devices right now, ask the user
 * before ignoring those events and applying the manual change.
 */
export async function withEventOverrideGuard(opts: {
  deviceIds: string[];
  ignoreAllTargets: boolean;
  apply: () => Promise<void>;
  onNeedConfirm: (pending: EventOverridePending) => void;
}): Promise<void> {
  const uniqueIds = Array.from(new Set(opts.deviceIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    await opts.apply();
    return;
  }

  let events: CoveringEvent[] = [];
  try {
    events = await getCoveringEvents(uniqueIds);
  } catch (err) {
    console.warn('[eventOverride] covering check failed', err);
    // Do not silently bypass — still apply, but surface failure in console
    await opts.apply();
    return;
  }

  if (events.length === 0) {
    await opts.apply();
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    opts.onNeedConfirm({
      events,
      ignoreAllTargets: opts.ignoreAllTargets,
      cancel: () => finish(),
      confirm: async () => {
        try {
          await Promise.all(
            events.map(async (ev) => {
              if (
                opts.ignoreAllTargets &&
                (ev.scope === 'organization' || ev.scope === 'venue')
              ) {
                await ignoreScheduleEvent(ev.id, { all: true });
                return;
              }
              const ids =
                ev.deviceIds && ev.deviceIds.length > 0
                  ? ev.deviceIds
                  : uniqueIds;
              await Promise.all(
                ids.map((deviceId) =>
                  ignoreScheduleEvent(ev.id, { deviceId })
                )
              );
            })
          );
          await opts.apply();
        } finally {
          finish();
        }
      },
    });
  });
}

export function describeCoveringEvents(events: CoveringEvent[]): string {
  return events
    .map((ev) => {
      const scope =
        ev.scope === 'organization'
          ? 'organization'
          : ev.scope === 'venue'
            ? 'venue'
            : 'device';
      return `“${ev.name}” (${ev.action} · ${scope})`;
    })
    .join(', ');
}
