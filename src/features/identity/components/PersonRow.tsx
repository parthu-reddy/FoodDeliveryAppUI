import { MessageSquare, Phone, User } from 'lucide-react';
import React from 'react';
import { Button, Surface } from '@shared/ui';

/**
 * A person on an order, and how to reach them.
 *
 * Rider-to-customer and customer-to-rider are the same component with the contact target
 * swapped — they were never going to differ, and writing them twice is how they would have.
 * There is no role prop: what the viewer may do arrives as capabilities.
 */

export interface PersonCapabilities {
  call?: boolean;
  message?: boolean;
}

interface PersonRowProps {
  name: string;
  /** "Delivery partner", "Customer" — what this person is to the viewer. */
  role: string;
  /** Rating or ETA node. A slot, so identity need not depend on reviews. */
  detail?: React.ReactNode;
  avatarUrl?: string;
  can?: PersonCapabilities;
  onCall?: () => void;
  onMessage?: () => void;
  className?: string;
}

export function PersonRow({
  name,
  role,
  detail,
  avatarUrl,
  can = {},
  onCall,
  onMessage,
  className = '',
}: PersonRowProps) {
  return (
    <Surface radius="lg" elevation={1} className={`flex items-center gap-3 p-3 ${className}`}>
      <span
        className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'var(--color-paper-sunken)', color: 'var(--color-ink-3)' }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          : <User className="w-5 h-5" aria-hidden="true" />}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold truncate" style={{ color: 'var(--color-ink)' }}>
          {name}
        </span>
        <span className="block text-[11px]" style={{ color: 'var(--color-ink-2)' }}>
          {role}
        </span>
        {detail}
      </span>

      <span className="flex items-center gap-2 shrink-0">
        {can.message && (
          <Button size="icon" variant="outline" aria-label={`Message ${name}`} onClick={onMessage}>
            <MessageSquare className="w-4 h-4" />
          </Button>
        )}
        {can.call && (
          <Button size="icon" variant="primary" aria-label={`Call ${name}`} onClick={onCall}>
            <Phone className="w-4 h-4" />
          </Button>
        )}
      </span>
    </Surface>
  );
}
