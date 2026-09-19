import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { Stepper } from '../form/Stepper';
import { DURATION, EASE } from '../motion/motionPresets';

/**
 * ADD, which becomes the quantity once there is one.
 *
 * The two states existed already — a `<Button>ADD</Button>` and a hand-rolled ±  row — and
 * swapped with no transition at all, so the control the thumb was aimed at changed shape
 * between frames. They are one control now, and the change of shape is the feedback that the
 * item went in.
 *
 * Spring on the way in (`--ease-spring`), because arriving in a cart should feel like a
 * catch; a plain fade on the way out. Under reduced motion the swap is instant, and both
 * states occupy the same place either way.
 */

interface AddToCartControlProps {
  quantity: number;
  /** What is being added, for the controls' accessible names. */
  label: string;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

export function AddToCartControl({
  quantity, label, onAdd, onIncrement, onDecrement, disabled = false,
}: AddToCartControlProps) {
  const reduceMotion = useReducedMotion();

  const morph = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, scale: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { duration: DURATION.fast, ease: EASE.spring },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {quantity === 0 ? (
        <motion.div key="add" {...morph}>
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="w-3.5 h-3.5" />}
            disabled={disabled}
            onClick={onAdd}
          >
            ADD
          </Button>
        </motion.div>
      ) : (
        <motion.div key="stepper" {...morph}>
          <Stepper
            value={quantity}
            label={label}
            min={0}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
