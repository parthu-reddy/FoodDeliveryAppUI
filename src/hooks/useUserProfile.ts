import { useState, useEffect } from 'react';
import { identityApi } from '../lib/zodiosClients';
import { getUserProfile } from '../lib/tokenStore';

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
          const p = res as unknown as UserProfileData;
          setProfile(p);
          if (!p.name || !p.email || p.name.trim() === '' || p.email.trim() === '') {
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
