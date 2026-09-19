import React from 'react';
import { RoleShell } from './RoleShell';

/**
 * The four role shells, each a thin configuration of `RoleShell`.
 *
 * They exist so that a role's ergonomics are stated in one place instead of being re-decided
 * on every screen. None of them re-implements the frame, and none of them touches a safe-area
 * inset — `RoleShell` owns that, and the Phase 4 gate fails if anything else names one.
 */

type ShellProps = {
  header?: React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  nav?: React.ReactNode;
  actionBar?: React.ReactNode;
  live?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** Customer: phone-first. Bottom tabs, and a live-order strip above them. */
export function CustomerShell({ header, nav, actionBar, live, onScroll, children, className }: ShellProps) {
  return (
    <RoleShell
      label="Customer"
      header={header}
      onScroll={onScroll}
      nav={nav}
      navPlacement="bottom"
      actionBar={actionBar}
      live={live}
      className={className}
    >
      {children}
    </RoleShell>
  );
}

/**
 * Restaurant: a propped-up tablet in landscape as often as a phone, and a desktop after that.
 * Side navigation from `lg:` so the order queue keeps the full height of the screen.
 */
export function RestaurantShell({ header, nav, actionBar, children, className }: ShellProps) {
  return (
    <RoleShell
      label="Restaurant"
      header={header}
      nav={nav}
      navPlacement="side"
      actionBar={actionBar}
      className={`lg:max-w-none ${className ?? ''}`}
    >
      {children}
    </RoleShell>
  );
}

/**
 * Delivery: one hand, outdoors, in sunlight. Dark is forced rather than preferred — it is a
 * legibility decision, not a style one, so it does not follow the OS setting.
 */
export function DeliveryShell({ header, actionBar, children, className }: ShellProps) {
  return (
    <RoleShell
      label="Delivery"
      header={header}
      actionBar={actionBar}
      dark
      className={className}
    >
      {children}
    </RoleShell>
  );
}

/** Admin: desktop-first, never used on a phone. Sidebar at `lg:`, tabs below it. */
export function AdminShell({ header, nav, children, className }: ShellProps) {
  return (
    <RoleShell
      label="Admin"
      header={header}
      nav={nav}
      navPlacement="side"
      className={`lg:max-w-none ${className ?? ''}`}
    >
      {children}
    </RoleShell>
  );
}
