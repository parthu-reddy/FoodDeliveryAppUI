import { useEffect, useState } from 'react';
import { getUserProfile, LocalUserProfile } from '../lib/tokenStore';
import { identityApi } from '../lib/zodiosClients';
import { z } from 'zod';

const UserProfileSchema = z.object({
  name: z.string().default(''),
  email: z.string().default(''),
  phoneNumber: z.string().default(''),
  id: z.string().default(''),
});

type UserProfileData = z.infer<typeof UserProfileSchema>;

interface UseUserProfileResult {
  profile: UserProfileData | null;
  isProfileIncomplete: boolean;
  isLoading: boolean;
  localProfile: LocalUserProfile | null;
}

/**
 * Shared hook to fetch user profile on mount and check for completeness.
 * Replaces the duplicated profile-fetch pattern in Customer, Restaurant, and Delivery dashboards.
 */
export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const localProfile = getUserProfile();

  useEffect(() => {
    identityApi.user.get('/api/v1/users/profile', undefined as never)
      .then(res => {
        if (res && res.data) {
          try {
            const result = UserProfileSchema.safeParse(res.data);
            if (result.success) {
              const p = result.data;
              setProfile(p);
              if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
                setIsProfileIncomplete(true);
              }
            } else {
              console.error('Failed to validate user profile data:', result.error);
            }
          } catch (e) {
            console.error('Failed to parse user profile data:', e);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch user profile:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { profile, isProfileIncomplete, isLoading, localProfile };
}
