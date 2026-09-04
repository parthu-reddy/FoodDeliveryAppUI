// UI Primitives — single import point for all shared components
// Usage: import { Button, Input, Modal, Badge } from '@shared/ui';

export { AlertBanner } from './AlertBanner';
export { Badge } from './Badge';
export { Button } from './Button';
export { Card } from './Card';
export { ConfirmDialog } from './ConfirmDialog';
export { FormField } from './FormField';
export { GlassCard } from './GlassCard';
export { Input } from './Input';
export { Modal } from './Modal';
export { SearchInput } from './SearchInput';
export { Select } from './Select';
export { SidebarNav } from './SidebarNav';
export { Spinner } from './Spinner';
export { StatCard } from './StatCard';
export { Textarea } from './Textarea';

// Re-exported from shared/ (presentation primitives)
export { default as CinematicFoodBackground } from './CinematicFoodBackground';
export { EmptyState } from './EmptyState';
export { LoadingSkeleton, MenuCategorySkeleton, RestaurantCardSkeleton, Skeleton } from './Skeleton';
export { TransactionHistoryTable } from "./TransactionHistoryTable";
export type { WalletTransaction } from "./TransactionHistoryTable";

// Auto-added remaining shared components
export { default as CompleteProfileModal } from "./CompleteProfileModal";
export { ErrorBoundary } from "./ErrorBoundary";
export { default as NamePromptModal } from "./NamePromptModal";
export { PaymentModal } from "./PaymentModal";
export { RefundModal } from "./RefundModal";
export { default as SharedSettingsView } from "./SharedSettingsView";
export { ZodErrorBoundary } from "./ZodErrorBoundary";
export { default as ZodiosSmokeTest } from "./ZodiosSmokeTest";
export { ActiveSessions } from "./ActiveSessions";
