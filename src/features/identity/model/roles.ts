import { Bike, Shield, Store, Utensils } from 'lucide-react';
import { RoleName, UserRole } from '@/types';

/**
 * The four ways into the app.
 *
 * `RoleSelector` had this written out five times — once per card in the desktop grid and once
 * more as the mobile carousel's data — so a change to a role's wording had to be made twice
 * and the desktop and mobile copy had already drifted apart in places.
 */

export interface RoleChoice {
  role: UserRole;
  icon: typeof Utensils;
  title: string;
  description: string;
  /** Which semantic accent the card's icon carries. */
  accent: 'action' | 'warning' | 'success' | 'info';
}

export const ROLE_CHOICES: RoleChoice[] = [
  {
    role: RoleName.CUSTOMER,
    icon: Utensils,
    title: 'Order Food',
    description: 'Browse top restaurants, customize dishes & order hot food',
    accent: 'warning',
  },
  {
    role: RoleName.RESTAURANT,
    icon: Store,
    title: 'Restaurant Partner',
    description: 'Manage incoming cooking tickets, stock statuses & earnings',
    accent: 'action',
  },
  {
    role: RoleName.DELIVERY,
    icon: Bike,
    title: 'Delivery Executive',
    description: 'Accept shipping contracts, view live map routes & payout stats',
    accent: 'success',
  },
  {
    role: RoleName.ADMIN,
    icon: Shield,
    title: 'System Admin',
    description: 'Manage overall operations, manual assignments, and system settings',
    accent: 'info',
  },
];

/** The dev-only sign-in numbers shown under the role cards. */
export const DEV_LOGINS: { label: string; phone: string }[] = [
  { label: 'Customer', phone: '8000000001' },
  { label: 'Restaurant', phone: '9000000001' },
  { label: 'Rider', phone: '7000000001' },
];
