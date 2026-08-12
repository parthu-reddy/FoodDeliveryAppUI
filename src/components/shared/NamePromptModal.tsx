import React, { useState } from 'react';
import { User, Check } from 'lucide-react';
import { z } from 'zod';
import { Modal, Button, FormField, Input } from '../ui';

const namePromptSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Please enter a valid email address').max(255, 'Email cannot exceed 255 characters')
});

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
    const validation = namePromptSchema.safeParse({ name: name.trim(), email: email.trim() });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    onSubmit(name.trim(), email.trim());
  };

  const header = (
    <div className="flex items-center gap-3 w-full mt-2">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
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
  );

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      size="sm"
      header={header}
    >
      <div className="p-6 pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="YOUR NAME" error={error}>
            <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-orange-500 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/20 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="px-4 text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="E.g. John Doe"
                className={`flex-1 !border-none !rounded-none !bg-transparent !py-3.5 !px-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
                autoFocus
              />
            </div>
          </FormField>
          
          <FormField label="EMAIL ADDRESS">
            <div className={`flex items-center border rounded-xl overflow-hidden focus-within:border-orange-500 transition-colors ${
              theme === 'dark'
                ? 'bg-slate-900/20 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="px-4 text-slate-400">
                <span className="font-mono text-sm">@</span>
              </div>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="john@example.com"
                className={`flex-1 !border-none !rounded-none !bg-transparent !py-3.5 !px-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              />
            </div>
          </FormField>

          <Button type="submit" variant="warning" fullWidth className="mt-4" icon={<Check className="w-4 h-4" />}>
            Continue
          </Button>
        </form>
      </div>
    </Modal>
  );
}
