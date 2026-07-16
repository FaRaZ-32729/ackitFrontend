import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import type { CustomDropdownOption } from './CustomDropdown';

interface MultiSelectDropdownProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  /** How many options stay visible before the list scrolls. */
  visibleCount?: number;
  className?: string;
}

/**
 * Multi-select dropdown with checkboxes.
 * Opens as an inline panel under the trigger so it stays inside the parent card
 * (no portal / no overflow outside the box).
 */
export function MultiSelectDropdown({
  values,
  onChange,
  options,
  placeholder = 'Select…',
  icon: Icon,
  disabled = false,
  visibleCount = 3,
  className = '',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label);

  const displayLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} venues selected`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const target = e.target as Node;
      if (!root.contains(target)) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleValue = (option: CustomDropdownOption) => {
    if (option.disabled) return;
    if (values.includes(option.value)) {
      onChange(values.filter((v) => v !== option.value));
    } else {
      onChange([...values, option.value]);
    }
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          w-full min-w-0 flex items-center gap-2
          bg-slate-50/50 text-slate-800 text-xs font-bold
          pl-4 pr-3 py-3 rounded-2xl
          border border-slate-200/50 shadow-inner
          focus:outline-none focus:border-blue-500 focus:bg-white
          transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${open ? 'border-blue-500 bg-white' : ''}
        `}
      >
        <span
          className={`flex-1 min-w-0 truncate text-left ${
            selectedLabels.length > 0 ? 'text-slate-800' : 'text-slate-400'
          }`}
        >
          {displayLabel}
        </span>
        <span className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {Icon && <Icon className="w-4 h-4" />}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? 'rotate-180 text-blue-500' : ''
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable
          className="
            mt-2 w-full min-w-0 flex flex-col
            bg-white rounded-2xl shadow-sm border border-slate-100
            py-1.5
            animate-in fade-in slide-in-from-top-1 duration-150
          "
          style={{
            maxHeight: `min(${visibleCount * 2.75}rem, 40svh)`,
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide">
            {options.length === 0 ? (
              <div className="px-4 py-2.5 text-xs font-semibold text-slate-400 italic">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isChecked = values.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isChecked}
                    disabled={option.disabled}
                    onClick={() => toggleValue(option)}
                    className={`
                      w-full min-w-0 flex items-center gap-3
                      text-left px-4 py-2.5 text-xs font-bold transition-colors
                      ${
                        option.disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : isChecked
                            ? 'text-blue-600 bg-blue-50/50'
                            : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                      }
                    `}
                  >
                    <span
                      className={`
                        w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                        ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300'
                        }
                      `}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
