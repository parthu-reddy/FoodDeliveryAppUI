import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import { useState } from 'react';
import type { UserRole } from '@/types';
import { Button, Surface } from '@shared/ui';
import { DEV_LOGINS, ROLE_CHOICES } from '../model/roles';
import { RoleCard } from './RoleCard';

/**
 * Pick a role to sign in as: a grid on desktop, a swipeable carousel on a phone.
 *
 * Was 214 lines holding five copies of the same card. The card is now `RoleCard` and the
 * roles are data in `model/roles`, so the two layouts render the same content by
 * construction rather than by someone remembering to change both.
 */

const CARD_WIDTH = 250;
const CARD_STRIDE = 266;
const DEV_MODE = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_OTP === 'true';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const step = (delta: number) =>
    setActiveIndex((prev) => (prev + delta + ROLE_CHOICES.length) % ROLE_CHOICES.length);

  const presets = useMotionPresets();
  return (
    <motion.div
      key="role-selector" {...presets.slideInX}
      transition={{ duration: 0.3 }}
      className="pt-4 sm:pt-6 md:pt-8 w-full"
    >
      {DEV_MODE && (
        <Surface
          variant="sunken"
          radius="xl"
          elevation={0}
          className="max-w-6xl mx-auto mb-8 p-4 text-center"
        >
          <h4
            className="font-bold mb-3 flex items-center justify-center gap-2"
            style={{ color: 'var(--color-warning)' }}
          >
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> Development Setup / Dummy Data
          </h4>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {DEV_LOGINS.map(({ label, phone }) => (
              <Surface key={label} radius="md" elevation={1} className="px-4 py-2">
                <span style={{ color: 'var(--color-ink-2)' }}>{label}: </span>
                <strong className="font-mono ml-1" style={{ color: 'var(--color-warning)' }}>
                  {phone}
                </strong>
              </Surface>
            ))}
          </div>
        </Surface>
      )}

      {/* Desktop: all four at once, because there is room for all four. */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full px-4">
        {ROLE_CHOICES.map((choice) => (
          <RoleCard
            key={choice.role}
            choice={choice}
            onSelect={() => onSelectRole(choice.role)}
          />
        ))}
      </div>

      {/* Phone and tablet: one at a time, swipeable. */}
      <div className="lg:hidden relative w-full max-w-lg mx-auto overflow-hidden px-10 py-6">
        <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30">
          <Button size="icon" variant="secondary" aria-label="Previous role" onClick={() => step(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30">
          <Button size="icon" variant="secondary" aria-label="Next role" onClick={() => step(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-full flex justify-center">
          <motion.div
            className="flex items-center gap-4 cursor-grab active:cursor-grabbing py-2"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) step(1);
              else if (info.offset.x > 40) step(-1);
            }}
            animate={{ x: `calc(50% - ${CARD_WIDTH / 2}px - ${activeIndex * CARD_STRIDE}px)` }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{ width: 'max-content' }}
          >
            {ROLE_CHOICES.map((choice, idx) => (
              <RoleCard
                key={choice.role}
                choice={choice}
                compact
                active={activeIndex === idx}
                className="shrink-0 w-[250px]"
                // A tap on an off-centre card brings it to the middle rather than choosing
                // it: on a carousel the card you can half-see is not the one you meant.
                onSelect={() => (activeIndex === idx ? onSelectRole(choice.role) : setActiveIndex(idx))}
              />
            ))}
          </motion.div>
        </div>

        <div className="flex justify-center items-center gap-2 mt-5" role="tablist">
          {ROLE_CHOICES.map((choice, idx) => (
            <button
              key={choice.role}
              role="tab"
              aria-selected={activeIndex === idx}
              aria-label={choice.title}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full cursor-pointer ${activeIndex === idx ? 'w-6' : 'w-2'}`}
              style={{
                background: activeIndex === idx ? 'var(--color-action)' : 'var(--color-paper-line)',
                transitionProperty: 'width, background-color',
                transitionDuration: 'var(--duration-base)',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
