import { useEffect, useState } from 'react';
import { getUserProfile } from '../lib/tokenStore';
import { identityApi } from '../lib/zodiosClients';

interface UserProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  id: string;
}

interface UseUserProfileResult {
  profile: UserProfileData | null;
  isProfileIncomplete: boolean;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localProfile: any;
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
    identityApi.user.get('/api/v1/users/profile', undefined as unknown as Parameters<typeof identityApi.user.get>[1])
      .then(res => {
        if (res) {
          const p = ('data' in res && typeof res.data === 'object' && res.data !== null) 
            ? (res.data as unknown as UserProfileData) 
            : (res as unknown as UserProfileData);
          setProfile(p);
          if (!p || !p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
            setIsProfileIncomplete(true);
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
