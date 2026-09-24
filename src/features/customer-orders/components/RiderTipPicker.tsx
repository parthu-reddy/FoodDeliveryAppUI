import { Surface } from '@shared/ui';

/**
 * "Tip your rider" from `Checkout.dc.html`: ₹0 / 10 / 20 / 30, all of it to the rider
 * (CustomerApplication `RiderTip` books it to the rider whole, untaxed).
 *
 * Starts at ₹0, not the artboard's ₹20: a tip the customer did not choose is a charge they did
 * not choose. They opt in.
 */

const TIP_CHOICES = [0, 10, 20, 30] as const;

export function RiderTipPicker({ tip, onChange }: { tip: number; onChange: (tip: number) => void }) {
  return (
    <Surface radius="lg" elevation={1} className="p-3.5">
      <div className="flex items-center gap-2">
        <span id="tip-label" className="flex-1 text-[13px] font-bold text-ink">Tip your rider</span>
        <span className="text-[11px] font-medium text-ink-2">100% goes to them</span>
      </div>
      <div role="radiogroup" aria-labelledby="tip-label" className="mt-2.5 flex gap-2">
        {TIP_CHOICES.map((amount) => {
          const selected = tip === amount;
          return (
            <button
              key={amount}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(amount)}
              className="flex-1 h-10 rounded-md font-mono text-[13px] font-bold text-ink border border-paper-line"
              style={selected ? { background: 'var(--color-danger-bg)', borderColor: 'var(--color-action)', color: 'var(--color-danger)' } : undefined}
            >
              &#8377;{amount}
            </button>
          );
        })}
      </div>
    </Surface>
  );
}
