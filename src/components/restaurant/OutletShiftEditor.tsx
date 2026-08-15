import React, { useState } from 'react';
import { Clock, Plus, Trash2, CheckCircle, X, AlertCircle } from 'lucide-react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '../../lib/zodiosClients';
import { z } from 'zod';

const shiftSchema = z.object({
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid opening time format'),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid closing time format')
});

interface OutletShiftEditorProps {
  outlet: any;
  onRefresh: () => void;
  onClose: () => void;
}

export default function OutletShiftEditor({ outlet, onRefresh, onClose }: OutletShiftEditorProps) {
  const [timings, setTimings] = useState<{ openingTime: string; closingTime: string }[]>(
    outlet.timings && outlet.timings.length > 0
      ? outlet.timings.map((t: any) => ({
          openingTime: t.openingTime.substring(0, 5),
          closingTime: t.closingTime.substring(0, 5),
        }))
      : [{ openingTime: '09:00', closingTime: '22:00' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addTiming = () => {
    setTimings([...timings, { openingTime: '09:00', closingTime: '22:00' }]);
  };

  const removeTiming = (index: number) => {
    setTimings(timings.filter((_, i) => i !== index));
  };

  const updateTiming = (index: number, field: 'openingTime' | 'closingTime', value: string) => {
    const newTimings = [...timings];
    newTimings[index][field] = value;
    setTimings(newTimings);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (timings.length === 0) {
      setError('At least one shift is required.');
      return;
    }
    
    for (const t of timings) {
      if (!t.openingTime || !t.closingTime) {
        setError('Please fill all timing fields.');
        return;
      }
      const validation = shiftSchema.safeParse(t);
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formattedTimings = timings.map(t => ({
        openingTime: t.openingTime.length === 5 ? t.openingTime + ":00" : t.openingTime,
        closingTime: t.closingTime.length === 5 ? t.closingTime + ":00" : t.closingTime
      }));
      await (customerApi.put as any)(`/api/v1/outlets/${outlet.id}/timings`, { timings: formattedTimings });
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update timings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 dark:bg-slate-950/20 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6] flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Edit Shifts for {outlet.name}
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-4">
          
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Operating Shifts</label>
            <button
              type="button"
              onClick={addTiming}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 dark:text-orange-400 flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-lg"
            >
              <Plus className="w-3 h-3" /> Add Shift
            </button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {timings.map((timing, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1">Opens</label>
                    <input
                      type="time"
                      required
                      value={timing.openingTime}
                      onChange={e => updateTiming(index, 'openingTime', e.target.value)}
                      className="glass-input w-full rounded-lg px-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1">Closes</label>
                    <input
                      type="time"
                      required
                      value={timing.closingTime}
                      onChange={e => updateTiming(index, 'closingTime', e.target.value)}
                      className="glass-input w-full rounded-lg px-2 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                </div>
                {timings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTiming(index)}
                    className="p-2 mt-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Remove Shift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#f0ede6] text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
