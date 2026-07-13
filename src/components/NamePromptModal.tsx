import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Check } from 'lucide-react';

interface NamePromptModalProps {
  theme: 'light' | 'dark';
  onSubmit: (name: string, email: string) => void;
}

export default function NamePromptModal({ theme, onSubmit }: NamePromptModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    onSubmit(name.trim(), email.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full max-w-sm rounded-3xl border shadow-2xl p-6 overflow-hidden ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Welcome!
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Please tell us your name and email
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              YOUR NAME
            </label>
            <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-orange-500 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="px-4 text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="E.g. John Doe"
                className={`flex-1 py-3.5 px-2 bg-transparent outline-none text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
                autoFocus
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              EMAIL ADDRESS
            </label>
            <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-orange-500 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/50 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="px-4 text-slate-400">
                <span className="font-mono text-sm">@</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="john@example.com"
                className={`flex-1 py-3.5 px-2 bg-transparent outline-none text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
}
