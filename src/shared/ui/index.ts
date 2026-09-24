// UI primitives — the single import point for shared components.
// Usage: import { Button, Select, Modal, Surface } from '@shared/ui';
//
// Nothing outside shared/ui may reference a design token directly, hand-roll an overlay,
// portal, or render a native <select>, alert() or confirm(). The Phase 2 gate checks all of it:
//   python3 RandomDocuments/UIRedesign_2026-09-18/tools/validate_phase2.py

// --- surface: the only owner of elevation / glass / blur / radius tokens -------------
export { Surface } from './surface/Surface';
export { surfaceStyle } from './surface/surfaceStyle';
export type { SurfaceElevation, SurfaceRadius, SurfaceVariant } from './surface/surfaceStyle';

// --- overlay: the only portal, focus trap and scroll lock in the app ------------------
export { Overlay } from './overlay/Overlay';
export type { OverlayPlacement } from './overlay/Overlay';
export { Modal } from './overlay/Modal';
export { ConfirmProvider, useConfirm } from './overlay/ConfirmDialog';
export { ToastRegion } from './overlay/ToastRegion';
export type { ToastItem, ToastType } from './overlay/ToastRegion';
export type { ConfirmOptions, ConfirmTone } from './overlay/ConfirmDialog';

// --- action ---------------------------------------------------------------------------
export { AddToCartControl } from './action/AddToCartControl';
export { Button } from './action/Button';
export { SwipeAction } from './action/SwipeAction';

// --- form -----------------------------------------------------------------------------
export { Select } from './form/Select';
export { Stepper } from './form/Stepper';
export { Switch } from './form/Switch';
export type { SelectOption } from './form/selectStyle';

// --- shell: the only owner of safe-area insets -----------------------------------------
export { RoleShell } from './shell/RoleShell';
export type { NavPlacement } from './shell/RoleShell';
export { AdminShell, CustomerShell, DeliveryShell, RestaurantShell } from './shell/RoleShells';

// --- navigation ---------------------------------------------------------------------
export { Tabs } from './navigation/Tabs';
export type { TabItem } from './navigation/Tabs';

// --- motion: the app's motion vocabulary, reduced-motion aware ------------------------
export { ScreenTransition } from './motion/ScreenTransition';
export { screenTransitionVariants } from './motion/screenTransitionVariants';
export { useMotionPresets, prefersReducedMotion, DURATION, EASE, STAGGER_STEP, STAGGER_MAX_ITEMS } from './motion/motionPresets';
export type { MotionPreset } from './motion/motionPresets';

// --- map: the only builder of a maplibre marker element -------------------------------
export { createMapCallout, createMapPin } from './map/mapMarker';
export type { MapPinOptions, MapPinTone } from './map/mapMarker';

// --- data ------------------------------------------------------------------------------
export { DataTable } from './data/DataTable';
export type { Column } from './data/DataTable';

// --- feedback ---------------------------------------------------------------------------
export { PullToRefresh } from './feedback/PullToRefresh';
export { Spinner } from './feedback/Spinner';
export { StatusPill } from './feedback/StatusPill';
export type { StatusTone } from './feedback/StatusPill';

// --- not yet migrated to the new layout (phases 3-4) -----------------------------------
export { AlertBanner } from './AlertBanner';
export { Badge } from './Badge';
export { FormField } from './FormField';
export { Input } from './Input';
export { SearchInput } from './SearchInput';
export { SidebarNav } from './SidebarNav';
export { StatCard } from './StatCard';
export { Textarea } from './Textarea';

export { EmptyState } from './EmptyState';
export { LoadingSkeleton, MenuCategorySkeleton, RestaurantCardSkeleton, Skeleton } from './Skeleton';
export { TransactionHistoryTable } from './TransactionHistoryTable';
export type { WalletTransaction } from './TransactionHistoryTable';
export { default as CompleteProfileModal } from './CompleteProfileModal';
export { ErrorBoundary } from './ErrorBoundary';
export { default as NamePromptModal } from './NamePromptModal';
export { PaymentModal } from './PaymentModal';
export { RefundModal } from './RefundModal';
export { default as SharedSettingsView } from './SharedSettingsView';
export { ZodErrorBoundary } from './ZodErrorBoundary';
export { default as ZodiosSmokeTest } from './ZodiosSmokeTest';
export { ActiveSessions } from './ActiveSessions';
export * from './navigation/RoleGuard';
