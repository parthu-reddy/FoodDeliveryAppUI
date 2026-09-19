import { Button, FormField, Input } from '@shared/ui';
import { DEFAULT_TIMING, type OutletTiming } from '@features/catalog/model/outletTimings';
import { Clock, Plus, Trash2 } from 'lucide-react';


/**
 * The outlet's operating shifts: a list of open/close pairs, with at least one always present.
 *
 * Split out of OutletRegistration, which carried the map, the place search, the outlet form
 * and this in one 464-line file. The three handlers came with it because nothing else touches
 * the list — `updateTiming` in particular mutated the copied row in place, which is the kind
 * of thing that survives precisely because it sits in the middle of something too long to read.
 */
export function OutletTimingsField({
  timings, setTimings,
}: { timings: OutletTiming[]; setTimings: (next: OutletTiming[]) => void }) {
  const addTiming = () => {
    setTimings([...timings, { ...DEFAULT_TIMING }]);
  };

  const updateTiming = (index: number, field: 'openingTime' | 'closingTime', value: string) => {
    setTimings(timings.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTiming = (index: number) => {
    if (timings.length > 1) {
      setTimings(timings.filter((_, i) => i !== index));
    }
  };

  return (
<div className="space-y-3 pt-2">
<div className="flex items-center justify-between">
<label className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase flex items-center gap-1">
<Clock className="w-3 h-3" />
Operating Shifts
</label>
<button
type="button"
onClick={addTiming}
className="text-xs font-bold text-amber-500 hover:text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg"
>
<Plus className="w-3 h-3" /> Add Shift
</button>
</div>

<div className="space-y-2">
{timings.map((timing, index) => (
<div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/20 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
<div className="flex-1 grid grid-cols-2 gap-2">
<FormField label="Opens" required>
<Input
type="time"
required
value={timing.openingTime}
onChange={e => updateTiming(index, 'openingTime', e.target.value)}
/>
</FormField>
<FormField label="Closes" required>
<Input
type="time"
required
value={timing.closingTime}
onChange={e => updateTiming(index, 'closingTime', e.target.value)}
/>
</FormField>
</div>
{timings.length > 1 && (
<Button
type="button"
variant="ghost"
size="icon"
onClick={() => removeTiming(index)}
className="mt-4 text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-950/30"
title="Remove Shift"
>
<Trash2 className="w-4 h-4" />
</Button>
)}
</div>
))}
</div>
</div>
  );
}
