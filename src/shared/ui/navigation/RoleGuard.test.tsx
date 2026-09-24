import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleName } from '@/types';
import { RoleGuard } from './RoleGuard';

/**
 * `RoleGuard` decides who may see a role's routes, so it is worth testing for what it
 * REFUSES as much as for what it allows. The Phase 2 gate flagged it as the one primitive
 * without a test.
 */

const getUserProfile = vi.hoisted(() => vi.fn());
vi.mock('@/lib/tokenStore', () => ({ getUserProfile }));

/** Renders the guard around a protected page, plus a landing page per role to redirect to. */
function renderAt(path: string, allowedRole: RoleName) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RoleGuard allowedRole={allowedRole} />}>
          <Route path="/customer" element={<p>customer area</p>} />
        </Route>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/restaurant" element={<p>restaurant area</p>} />
        <Route path="/delivery" element={<p>delivery area</p>} />
        <Route path="/admin" element={<p>admin area</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RoleGuard', () => {
  beforeEach(() => getUserProfile.mockReset());

  it('sends a signed-out visitor to login', () => {
    getUserProfile.mockReturnValue(null);
    renderAt('/customer', RoleName.CUSTOMER);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('customer area')).not.toBeInTheDocument();
  });

  it('sends a profile with no role to login rather than trusting it', () => {
    getUserProfile.mockReturnValue({ id: 'u1', phone: '8000000001' });
    renderAt('/customer', RoleName.CUSTOMER);
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders the protected route when the role matches', () => {
    getUserProfile.mockReturnValue({ role: RoleName.CUSTOMER });
    renderAt('/customer', RoleName.CUSTOMER);
    expect(screen.getByText('customer area')).toBeInTheDocument();
  });

  it('redirects another role to its OWN area, not to the one it asked for', () => {
    // The part that matters: a restaurant account must not land in the customer area.
    getUserProfile.mockReturnValue({ role: RoleName.RESTAURANT });
    renderAt('/customer', RoleName.CUSTOMER);
    expect(screen.getByText('restaurant area')).toBeInTheDocument();
    expect(screen.queryByText('customer area')).not.toBeInTheDocument();
  });

  it.each([
    [RoleName.DELIVERY, 'delivery area'],
    [RoleName.ADMIN, 'admin area'],
  ])('redirects %s to its own area', (role, expected) => {
    getUserProfile.mockReturnValue({ role });
    renderAt('/customer', RoleName.CUSTOMER);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('falls back to login for a role it does not recognise', () => {
    // An unknown role must not be treated as permission to stay.
    getUserProfile.mockReturnValue({ role: 'SOMETHING_ELSE' });
    renderAt('/customer', RoleName.CUSTOMER);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('customer area')).not.toBeInTheDocument();
  });
});
