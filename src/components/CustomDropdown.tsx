import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';

export interface CustomDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  /** How many options stay visible before the list scrolls (mobile-friendly default: 3). */
  visibleCount?: number;
  className?: string;
  /**
   * When true, custom UI shows below `lg` only; at `lg+` a native `<select>` is used
   * so desktop modals/screens keep their original look.
   */
  desktopNative?: boolean;
  /** Classes applied to the desktop native `<select>` when `desktopNative` is set. */
  nativeClassName?: string;
}

/**
 * Mobile custom select — matches Ackit form field chrome.
 * Panel height grows with content up to ~visibleCount rows, then scrolls.
 * Width follows the trigger (flex/grid parent), never a fixed pixel size.
 * List is portaled so it works inside overflow-clipped modals.
 */
export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  icon: Icon,
  disabled = false,
  visibleCount = 3,
  className = '',
  desktopNative = false,
  nativeClassName = 'w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none',
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const [panelRect, setPanelRect] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const updatePanelRect = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estimatedMax = Math.min(visibleCount * 44, window.innerHeight * 0.4);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < estimatedMax + 12 && r.top > spaceBelow;
    setPanelRect({
      top: openUp ? r.top - 8 : r.bottom + 8,
      left: r.left,
      width: r.width,
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPanelRect(null);
      return;
    }
    updatePanelRect();
    window.addEventListener('resize', updatePanelRect);
    window.addEventListener('scroll', updatePanelRect, true);
    return () => {
      window.removeEventListener('resize', updatePanelRect);
      window.removeEventListener('scroll', updatePanelRect, true);
    };
  }, [open, visibleCount]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = (option: CustomDropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const customTrigger = (
    <div className={`relative min-w-0 w-full ${desktopNative ? 'lg:hidden' : ''} ${className}`}>
      <button
        ref={triggerRef}
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
            selected ? 'text-slate-800' : 'text-slate-400'
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
    </div>
  );

  const panel =
    open &&
    panelRect &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[60] bg-transparent"
          aria-hidden
          onClick={() => setOpen(false)}
        />
        <div
          id={listId}
          role="listbox"
          className="
            fixed z-[70] flex flex-col min-w-0
            bg-white rounded-2xl shadow-xl border border-slate-100
            py-1.5
            animate-in fade-in duration-150
          "
          style={{
            left: panelRect.left,
            width: panelRect.width,
            ...(panelRect.openUp
              ? { bottom: window.innerHeight - panelRect.top }
              : { top: panelRect.top }),
            maxHeight: `min(${visibleCount * 2.75}rem, 40svh)`,
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain dropdown-scroll">
            {options.length === 0 ? (
              <div className="px-4 py-2.5 text-xs font-semibold text-slate-400 italic">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isActive = option.value === value;
                return (
                  <button
                    key={option.value === '' ? `__empty-${option.label}` : option.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full min-w-0 flex items-center justify-between gap-2
                      text-left px-4 py-2.5 text-xs font-bold transition-colors
                      ${
                        option.disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : isActive
                            ? 'text-blue-600 bg-blue-50/50'
                            : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                      }
                    `}
                  >
                    <span className="flex-1 min-w-0 truncate">{option.label}</span>
                    {isActive && !option.disabled && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </>,
      document.body
    );

  return (
    <>
      {customTrigger}
      {panel}
      {desktopNative && (
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`hidden lg:block ${nativeClassName}`}
        >
          {placeholder && !options.some((o) => o.value === value) && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value === '' ? `__empty-${option.label}` : option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
