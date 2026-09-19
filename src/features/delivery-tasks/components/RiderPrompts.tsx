import { AlertCircle, User } from 'lucide-react';
import React from 'react';
import { Button, Modal } from '@shared/ui';

/**
 * The two things that stop a rider going on duty: missing permissions and a missing profile.
 *
 * They were two near-identical 30-line modal bodies at the bottom of the dashboard. Same
 * shape, same copy structure, different icon and tone — so they are one component with those
 * as props.
 */

interface RiderPromptProps {
  open: boolean;
  onClose: () => void;
  onAct: () => void;
}

function Prompt({
  open, onClose, onAct, icon, tone, title, description, actionLabel,
}: RiderPromptProps & {
  icon: React.ReactNode;
  tone: string;
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title} headerless>
      <div className="p-8 pb-6 flex flex-col items-center text-center">
        <span
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ background: `var(--color-${tone}-bg)`, color: `var(--color-${tone})` }}
        >
          {icon}
        </span>
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-ink)' }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--color-ink-2)' }}>
          {description}
        </p>
        <Button size="touch" onClick={onAct} variant="primary" fullWidth>
          {actionLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function PermissionsPrompt(props: RiderPromptProps) {
  return (
    <Prompt
      {...props}
      icon={<AlertCircle className="w-8 h-8" />}
      tone="info"
      title="Permissions Required"
      description="To receive order assignments and go on duty, we need your permission to access your location and send notifications."
      actionLabel="Enable Permissions"
    />
  );
}

export function ProfileRequiredPrompt(props: RiderPromptProps) {
  return (
    <Prompt
      {...props}
      icon={<User className="w-8 h-8" />}
      tone="danger"
      title="Profile Required"
      description="Please complete your driver profile (Name, Vehicle) before you can go on duty and start receiving orders."
      actionLabel="Complete Profile"
    />
  );
}
