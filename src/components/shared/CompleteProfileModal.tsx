import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { customerApi, deliveryApi, identityApi, restaurantApi, walletApi, adminApi, trackingApi } from '../../lib/zodiosClients';
import { z } from 'zod';
import { Modal, Button, FormField, Input, Spinner } from '../ui';

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
      await (identityApi.put as any)('/api/v1/users/profile', {
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

  const header = (
    <div className="text-center w-full mt-2">
      <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Welcome!</h2>
      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
        Please complete your profile to continue. This is required to process your orders.
      </p>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} 
      size="md" 
      header={header}
    >
      <div className="p-6 pt-2">
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full Name" required>
            <Input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 text-white focus:border-rose-500' : 'bg-slate-50/50 border-slate-200/50 text-slate-900 focus:border-rose-500'}
            />
          </FormField>

          <FormField label="Email Address" required>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className={theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50 text-white focus:border-rose-500' : 'bg-slate-50/50 border-slate-200/50 text-slate-900 focus:border-rose-500'}
            />
          </FormField>

          <Button 
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            fullWidth
            className="mt-4"
          >
            {isSubmitting ? (
              <Spinner size="md" className="text-white" />
            ) : (
              'Save Profile & Continue'
            )}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
