import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiPut } from '../lib/apiClient';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.').max(100, 'Name cannot exceed 100 characters.'),
  email: z.string().min(1, 'Please enter your email address.').email('Please enter a valid email address.').max(255, 'Email cannot exceed 255 characters.')
});

interface CompleteProfileModalProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  onComplete: (profile: any) => void;
  profileId: string;
}

export default function CompleteProfileModal({ isOpen, theme, onComplete, profileId }: CompleteProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = profileSchema.safeParse({ name: name.trim(), email: email.trim() });
    
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPut('/api/v1/users/profile', {
        id: profileId,
        name: name.trim(),
        email: email.trim(),
      });
      onComplete({ name: name.trim(), email: email.trim() });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
          >
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Welcome!</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Please complete your profile to continue. This is required to process your orders.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-rose-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500'
                    }`}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 mt-4 rounded-xl text-white font-bold transition-all flex justify-center items-center ${
                    isSubmitting ? 'bg-rose-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Save Profile & Continue'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
