import { Input, Spinner } from '@shared/ui';
import type { PlacePrediction } from '@features/maps-tracking/model/usePlaceAutocomplete';
import { MapPin, Navigation, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';

interface PlaceSearchFieldProps {
  value: string;
  onChange: (query: string) => void;
  results: PlacePrediction[];
  isSearching: boolean;
  onSelect: (placeId: string, description: string) => void;
  onUseCurrentLocation: () => void;
  placeholder?: string;
}

/**
 * Search for a place, with its predictions and a "locate me" shortcut.
 *
 * The delivery-address modal and the outlet registration screen had this same field, the same
 * dropdown and the same two states written out separately, with the input hand-rolled in both
 * rather than taken from the primitive.
 */
export function PlaceSearchField({
  value, onChange, results, isSearching, onSelect, onUseCurrentLocation,
  placeholder = 'Search for area, street name...',
}: PlaceSearchFieldProps) {
  const presets = useMotionPresets();
  return (
<div className="relative">
<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-300" />
<Input
type="text"
inputSize="lg"
aria-label="Search for a place"
placeholder={placeholder}
value={value}
onChange={e => onChange(e.target.value)}
className="pl-10 pr-10 font-medium focus:ring-2 focus:ring-rose-500/50"
/>
<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
{isSearching ? (
<Spinner size="sm" label="" />
) : (
<button
onClick={onUseCurrentLocation}
className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
title="Use Current Location"
>
<Navigation className="w-3 h-3" />
<span className="hidden sm:inline">Locate Me</span>
</button>
)}
</div>

{/* Search Results Dropdown */}
<AnimatePresence>
{results.length > 0 && (
<motion.div {...presets.rise}
className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto"
>
{results.map((result) => (
<button
key={result.place_id}
onClick={() => onSelect(result.place_id, result.description)}
className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-start gap-3"
>
<MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
<div>
<p className="text-sm font-medium text-slate-700 dark:text-slate-200">{result.description.split(',')[0]}</p>
<p className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.description}</p>
</div>
</button>
))}
</motion.div>
)}
</AnimatePresence>
</div>
  );
}
