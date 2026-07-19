import React, { useState } from 'react';
import { Settings, CheckCircle, X, AlertCircle } from 'lucide-react';
import { apiPut } from '../lib/apiClient';

interface OutletSettingsEditorProps {
  outlet: any;
  onRefresh: () => void;
  onClose: () => void;
}

export default function OutletSettingsEditor({ outlet, onRefresh, onClose }: OutletSettingsEditorProps) {
  const [defaultPrepTimeSeconds, setDefaultPrepTimeSeconds] = useState(
    outlet.defaultPrepTimeSeconds || 900
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!defaultPrepTimeSeconds || defaultPrepTimeSeconds <= 0) {
      setError('Preparation time must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPut(`/api/v1/outlets/${outlet.id}/settings`, { 
        defaultPrepTimeSeconds: parseInt(defaultPrepTimeSeconds.toString()) 
      });
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 dark:bg-slate-950/20 backdrop-blur-sm p-4">
      <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-[#f0ede6] flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-500" />
            Outlet Settings
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

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1">Default Prep Time (Seconds)</label>
              <input
                type="number"
                required
                min="60"
                step="60"
                value={defaultPrepTimeSeconds}
                onChange={e => setDefaultPrepTimeSeconds(e.target.value)}
                className="w-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-[#f0ede6] focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <p className="text-[10px] text-slate-400 mt-1 px-1">
                E.g. 900 seconds = 15 minutes
              </p>
            </div>
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
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
