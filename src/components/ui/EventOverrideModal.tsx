import React, { useState } from 'react';
import { Modal } from './Modal';
import {
  describeCoveringEvents,
  type EventOverridePending,
} from '../../utils/eventOverride';

interface EventOverrideModalProps {
  pending: EventOverridePending | null;
  onClose: () => void;
}

export function EventOverrideModal({
  pending,
  onClose,
}: EventOverrideModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = () => {
    if (busy) return;
    pending?.cancel();
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError('');
    try {
      await pending.confirm();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to ignore event';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const subtitle = pending
    ? pending.ignoreAllTargets
      ? 'Ignore this schedule for all devices it currently covers, then apply your change?'
      : 'Ignore this schedule for this device only, then apply your change?'
    : undefined;

  return (
    <Modal
      isOpen={!!pending}
      onClose={handleCancel}
      title="Ignore running event?"
      subtitle={subtitle}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          {pending
            ? `A schedule is currently active: ${describeCoveringEvents(pending.events)}. Manual changes will not stick unless you ignore it.`
            : null}
        </p>
        {error ? (
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer disabled:opacity-50"
          >
            No, keep event
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConfirm()}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Applying…' : 'Yes, ignore & change'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
