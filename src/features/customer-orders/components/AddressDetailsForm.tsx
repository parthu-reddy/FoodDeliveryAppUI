import { Input, Surface, Textarea } from '@shared/ui';

interface AddressDetailsFormProps {
  label: string;
  setLabel: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  zipCode: string;
  setZipCode: (v: string) => void;
  /** Clears the page's error the moment the person starts fixing it. */
  onEdit: () => void;
}

/**
 * Label, street, city, state and ZIP, as the address page collects them.
 *
 * Split out of CustomerAddressPage. Every field here was a hand-rolled `<input>` carrying the
 * same 120-character class string five times over; they are `Input` and `Textarea` now.
 */
export function AddressDetailsForm({
  label, setLabel, address, setAddress, city, setCity, state, setState, zipCode, setZipCode, onEdit,
}: AddressDetailsFormProps) {
  return (
  <Surface radius="xl" elevation={1} className="space-y-4 p-5 sm:p-6">
    <div className="flex gap-4">
       <div className="flex-1 space-y-1.5">
          <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Label</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Home, Work"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          />
       </div>
    </div>
    <div className="space-y-1.5">
      <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address Line 1</label>
      <Textarea
        value={address}
        onChange={(e) => { setAddress(e.target.value); onEdit(); }}
        rows={2}
        className="font-medium focus:ring-2 focus:ring-rose-500/50"
        required
        minLength={5}
        maxLength={255}
      />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
       <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</label>
          <Input
            type="text"
            value={city}
            onChange={e => { setCity(e.target.value); onEdit(); }}
            className="font-medium focus:ring-2 focus:ring-rose-500/50"
            required
            minLength={2}
            maxLength={100}
          />
       </div>
       <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">State</label>
          <Input
            type="text"
            value={state}
            onChange={e => { setState(e.target.value); onEdit(); }}
            className="font-medium focus:ring-2 focus:ring-rose-500/50"
            required
            minLength={2}
            maxLength={100}
          />
       </div>
       <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">Zip</label>
          <Input
            type="text"
            value={zipCode}
            onChange={e => { setZipCode(e.target.value); onEdit(); }}
            className="font-medium focus:ring-2 focus:ring-rose-500/50"
            required
            pattern="^\d{5,10}$"
          />
       </div>
    </div>
    </Surface>
  );
}
