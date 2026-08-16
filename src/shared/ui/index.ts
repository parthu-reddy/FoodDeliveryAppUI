// UI Primitives — single import point for all shared components
// Usage: import { Button, Input, Modal, Badge } from '@shared/ui';

export { Spinner } from './Spinner';
export { Badge } from './Badge';
export { Button } from './Button';
export { Input } from './Input';
export { FormField } from './FormField';
export { Select } from './Select';
export { Textarea } from './Textarea';
export { SearchInput } from './SearchInput';
export { Modal } from './Modal';
export { Card } from './Card';
export { GlassCard } from './GlassCard';
export { StatCard } from './StatCard';
export { SidebarNav } from './SidebarNav';
export { AlertBanner } from './AlertBanner';
export { ConfirmDialog } from './ConfirmDialog';

// Re-exported from shared/ (presentation primitives)
export { Skeleton, LoadingSkeleton, RestaurantCardSkeleton, MenuCategorySkeleton } from './Skeleton';
export { EmptyState } from './EmptyState';
export { TransactionHistoryTable } from "./TransactionHistoryTable";
export type { WalletTransaction } from "./TransactionHistoryTable";
export { default as CinematicFoodBackground } from './CinematicFoodBackground';

// Auto-added remaining shared components
export { default as CompleteProfileModal } from "./CompleteProfileModal";
export { ErrorBoundary } from "./ErrorBoundary";
export { default as NamePromptModal } from "./NamePromptModal";
export { PaymentModal } from "./PaymentModal";
export { RefundModal } from "./RefundModal";
export { default as SharedSettingsView } from "./SharedSettingsView";
export { ZodErrorBoundary } from "./ZodErrorBoundary";
export { default as ZodiosSmokeTest } from "./ZodiosSmokeTest";
