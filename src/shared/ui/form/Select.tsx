import { Check, ChevronDown } from 'lucide-react';
import { SELECT_SIZE, type SelectOption, type SelectSize } from './selectStyle';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * A real listbox. Renders NO native <select> anywhere in its implementation.
 *
 * The component this replaces was a native <select> with `appearance-none`, which on Android
 * and iOS hands off to the OS picker: a full-screen system sheet in system fonts and system
 * colours that cannot be styled, animated or themed. It was the single most visible break in
 * the design, and it was in the file called "the shared Select".
 *
 * Implements the ARIA combobox/listbox pattern: roles, aria-expanded, aria-activedescendant,
 * arrow/Home/End navigation, typeahead, Escape to close, click-outside, and focus returning
 * to the trigger on close.
 */

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectSize?: SelectSize;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}


export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  selectSize = 'md',
  error = false,
  disabled = false,
  id,
  name,
  className = '',
  ...aria
}: SelectProps) {
  const reactId = useId();
  const listId = `${id ?? reactId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const typeahead = useRef({ buffer: '', timer: 0 });

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const firstEnabled = useCallback(
    (from: number, step: number) => {
      for (let i = from; i >= 0 && i < options.length; i += step) {
        if (!options[i].disabled) return i;
      }
      return -1;
    },
    [options],
  );

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1));
  }, [disabled, firstEnabled, selectedIndex]);

  const closeList = useCallback((restoreFocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      closeList();
    },
    [closeList, onChange, options],
  );

  // Close when focus or the pointer leaves the whole control.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      closeList(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, closeList]);

  // Keep the active option in view during keyboard navigation.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex]);

  const runTypeahead = useCallback(
    (char: string) => {
      const state = typeahead.current;
      window.clearTimeout(state.timer);
      state.buffer += char.toLowerCase();
      state.timer = window.setTimeout(() => {
        state.buffer = '';
      }, 600);

      const match = options.findIndex(
        (option) => !option.disabled && option.label.toLowerCase().startsWith(state.buffer),
      );
      if (match >= 0) {
        if (open) setActiveIndex(match);
        else onChange(options[match].value);
      }
    },
    [onChange, open, options],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        openList();
        return;
      }
      if (event.key.length === 1 && /\S/.test(event.key)) runTypeahead(event.key);
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeList();
        break;
      case 'Tab':
        closeList(false);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => {
          const next = firstEnabled(i + 1, 1);
          return next === -1 ? i : next;
        });
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => {
          const next = firstEnabled(i - 1, -1);
          return next === -1 ? i : next;
        });
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(firstEnabled(0, 1));
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(firstEnabled(options.length - 1, -1));
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) runTypeahead(event.key);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value ?? ''} readOnly />}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={error || undefined}
        aria-label={aria['aria-labelledby'] ? undefined : (aria['aria-label'] ?? placeholder)}
        aria-labelledby={aria['aria-labelledby']}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onKeyDown}
        className="w-full flex items-center justify-between gap-2 text-left font-medium"
        style={{
          ...SELECT_SIZE[selectSize],
          background: 'var(--color-paper-sunken)',
          color: selected ? 'var(--color-ink)' : 'var(--color-ink-2)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-paper-line)'}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transitionProperty: 'border-color, box-shadow',
          transitionDuration: 'var(--duration-fast)',
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className="w-4 h-4 shrink-0"
          style={{
            color: 'var(--color-ink-2)',
            transform: open ? 'rotate(180deg)' : undefined,
            transitionProperty: 'transform',
            transitionDuration: 'var(--duration-fast)',
            transitionTimingFunction: 'var(--ease-out)',
          }}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={aria['aria-label'] ?? placeholder}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="absolute z-50 mt-1 w-full overflow-y-auto py-1"
          style={{
            maxHeight: 264,
            background: 'var(--color-paper)',
            border: '1px solid var(--color-paper-line)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--elevation-3)',
          }}
        >
          {options.length === 0 && (
            <li
              role="option"
              aria-selected={false}
              aria-disabled
              className="px-3 py-2 text-sm"
              style={{ color: 'var(--color-ink-2)' }}
            >
              No options
            </li>
          )}
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                data-value={option.value}
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(index)}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                style={{
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  opacity: option.disabled ? 0.5 : 1,
                  color: isSelected ? 'var(--color-action-ink)' : 'var(--color-ink)',
                  background: isActive ? 'var(--color-paper-sunken)' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
