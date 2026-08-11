import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm" sheet={false}>
      <div className="p-4 space-y-4">
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={buttonVariant} fullWidth onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
