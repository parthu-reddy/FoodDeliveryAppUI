import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RoleShell } from './RoleShell';

const inset = (el: HTMLElement | null, side: 'Top' | 'Bottom' | 'Left' | 'Right') =>
  el?.style[`padding${side}` as 'paddingTop'] ?? '';

describe('RoleShell', () => {
  it('names its main region', () => {
    render(<RoleShell label="Customer">content</RoleShell>);
    expect(screen.getByRole('main', { name: 'Customer' })).toBeInTheDocument();
  });

  it('pads the header for the status bar and the bottom chrome for the home indicator', () => {
    // The whole reason this component exists: safe-area was handled in 1 file of 188, so
    // every other screen ran under the notch.
    const { container } = render(
      <RoleShell label="Customer" header={<span>head</span>} nav={<span>nav</span>}>
        body
      </RoleShell>,
    );
    expect(inset(container.querySelector('header'), 'Top')).toContain('safe-area-inset-top');
    expect(inset(container.querySelector('nav'), 'Bottom')).toContain('safe-area-inset-bottom');
  });

  it('pads the sides for a landscape notch', () => {
    const { container } = render(<RoleShell label="Customer">body</RoleShell>);
    const shell = container.querySelector('[data-role-shell]') as HTMLElement;
    expect(inset(shell, 'Left')).toContain('safe-area-inset-left');
    expect(inset(shell, 'Right')).toContain('safe-area-inset-right');
  });

  it('gives the bottom inset to the scroll region only when nothing is pinned below it', () => {
    // Two elements both padding for the home indicator would double the gap.
    const bare = render(<RoleShell label="Customer">body</RoleShell>);
    expect(inset(bare.getByRole('main'), 'Bottom')).toContain('safe-area-inset-bottom');
    bare.unmount();

    const withNav = render(
      <RoleShell label="Customer" nav={<span>nav</span>}>body</RoleShell>,
    );
    expect(inset(withNav.getByRole('main'), 'Bottom')).toBe('');
  });

  it('lets the action bar own the bottom inset when both it and a nav are present', () => {
    const { container } = render(
      <RoleShell label="Customer" nav={<span>nav</span>} actionBar={<span>act</span>}>
        body
      </RoleShell>,
    );
    expect(inset(container.querySelector('footer'), 'Bottom')).toContain('safe-area-inset-bottom');
    expect(inset(container.querySelector('nav[data-surface]'), 'Bottom')).toBe('');
  });

  it('renders the slots it is given and nothing it is not', () => {
    const { container } = render(<RoleShell label="Customer">body</RoleShell>);
    expect(container.querySelector('header')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('nav')).toBeNull();
  });

  it('puts glass on the floating chrome, never on the content region', () => {
    const { container } = render(
      <RoleShell label="Customer" header={<span>h</span>} nav={<span>n</span>} actionBar={<span>a</span>}>
        body
      </RoleShell>,
    );
    for (const tag of ['header', 'footer', 'nav']) {
      expect(container.querySelector(tag)?.getAttribute('data-surface')).toBe('glass-chrome');
    }
    expect(screen.getByRole('main').getAttribute('data-surface')).toBeNull();
  });
});
