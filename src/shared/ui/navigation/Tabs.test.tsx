import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Tabs } from './Tabs';

const items = [
  { key: 'profile', label: 'Profile' },
  { key: 'history', label: 'History' },
  { key: 'wallet', label: 'Wallet' },
] as const;

const setup = (value: string = 'profile', onChange = vi.fn(), extra = {}) => {
  render(
    <Tabs items={[...items]} value={value} onChange={onChange} label="Account settings" {...extra} />,
  );
  return onChange;
};

describe('Tabs', () => {
  it('is a real tabset, not a row of buttons', () => {
    // None of the four hand-rolled tab bars this replaces had a role or aria-selected, so a
    // screen reader announced them as plain buttons with no indication of which was current.
    setup();
    expect(screen.getByRole('tablist', { name: 'Account settings' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Profile');
  });

  it('reports the selection to the caller', () => {
    const onChange = setup();
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    expect(onChange).toHaveBeenCalledWith('history');
  });

  it('moves with the arrow keys, and wraps', () => {
    const onChange = setup('profile');
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('history');

    onChange.mockClear();
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('wallet');
  });

  it('keeps exactly one tab in the tab order', () => {
    // Roving tabindex: Tab enters the set once, then arrows move within it.
    setup('history');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.filter((t) => t.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('tabindex', '0');
  });

  it('marks a disabled tab as disabled and will not select it by click', () => {
    // RestaurantSettingsShell gates two of its three sections on an outlet existing. Before
    // this the tabset had no way to say so, so the screen hand-rolled the whole bar.
    const onChange = vi.fn();
    render(
      <Tabs
        items={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B', disabled: true }]}
        value="a"
        onChange={onChange}
        label="t"
      />,
    );
    const disabled = screen.getByRole('tab', { name: 'B' });
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('steps over a disabled tab with the arrow keys', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B', disabled: true },
          { key: 'c', label: 'C' },
        ]}
        value="a"
        onChange={onChange}
        label="t"
      />,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('stays put when every other tab is disabled', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B', disabled: true }]}
        value="a"
        onChange={onChange}
        label="t"
      />,
    );
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('omits a hidden tab from the set and from arrow navigation', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[{ key: 'a', label: 'A' }, { key: 'b', label: 'B', hidden: true }, { key: 'c', label: 'C' }]}
        value="a"
        onChange={onChange}
        label="t"
      />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('crossfades the selected tab rather than snapping it', () => {
    render(<Tabs items={[...items]} value="profile" onChange={() => {}} label="Account" />);
    const selected = screen.getByRole('tab', { selected: true });
    expect(selected.style.transitionProperty).toBe('background-color, color, border-color');
    expect(selected.style.transitionDuration).toBe('var(--duration-fast)');
  });

  it('moves nothing, so prefers-reduced-motion needs no JS branch here', () => {
    // Only colour transitions, and index.css already zeroes every transition-duration under
    // `prefers-reduced-motion: reduce`. A useReducedMotion() call here would be a second
    // switch that can disagree with the first.
    render(<Tabs items={[...items]} value="profile" onChange={() => {}} label="Account" />);
    const selected = screen.getByRole('tab', { selected: true });
    expect(selected.style.transitionProperty).not.toMatch(/transform/);
    expect(selected.style.transform).toBe('');
  });
});
