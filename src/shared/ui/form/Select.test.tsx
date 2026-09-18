import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non-veg', label: 'Non-vegetarian' },
  { value: 'vegan', label: 'Vegan', disabled: true },
  { value: 'jain', label: 'Jain' },
];

function open() {
  fireEvent.click(screen.getByRole('combobox'));
}

describe('Select', () => {
  it('renders NO native <select> element', () => {
    const { container } = render(
      <Select options={options} onChange={() => {}} aria-label="Diet" />,
    );
    expect(container.querySelector('select')).toBeNull();
    open();
    expect(container.querySelector('select')).toBeNull();
  });

  it('exposes the combobox/listbox roles', () => {
    render(<Select options={options} onChange={() => {}} aria-label="Diet" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

    open();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(options.length);
  });

  it('opens with the keyboard and selects with Enter', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} aria-label="Diet" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('non-veg');
  });

  it('skips disabled options when navigating', () => {
    const onChange = vi.fn();
    render(<Select options={options} value="non-veg" onChange={onChange} aria-label="Diet" />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    open();

    // active starts on the selected option (index 1); ArrowDown must skip disabled index 2
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('jain');
  });

  it('tracks the active option with aria-activedescendant', () => {
    render(<Select options={options} onChange={() => {}} aria-label="Diet" />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).not.toHaveAttribute('aria-activedescendant');
    open();
    expect(trigger.getAttribute('aria-activedescendant')).toMatch(/-listbox-0$/);
  });

  it('marks the selected option with aria-selected', () => {
    render(<Select options={options} value="jain" onChange={() => {}} aria-label="Diet" />);
    open();
    const selected = screen.getAllByRole('option').filter(
      (o) => o.getAttribute('aria-selected') === 'true',
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Jain');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<Select options={options} onChange={() => {}} aria-label="Diet" />);
    const trigger = screen.getByRole('combobox');
    open();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('shows the placeholder until a value is chosen', () => {
    const { rerender } = render(
      <Select options={options} onChange={() => {}} placeholder="Pick a diet" aria-label="Diet" />,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick a diet');
    rerender(
      <Select options={options} value="veg" onChange={() => {}} placeholder="Pick a diet" aria-label="Diet" />,
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Vegetarian');
  });
});
