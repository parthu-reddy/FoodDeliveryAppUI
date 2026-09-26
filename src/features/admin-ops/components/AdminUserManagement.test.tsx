import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  identityApi: { adminUser: { get: (...a: unknown[]) => get(...a) } },
  customerApi: { adminOrder: { get: vi.fn().mockResolvedValue({ data: { content: [] } }) } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));
vi.mock('@/hooks/usePolling', () => ({ usePolling: () => ({ refetch: vi.fn() }) }));
// No 500 ms wait in a unit test: the debounce is not what is under test.
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (value: string) => value }));

import AdminUserManagement from './AdminUserManagement';
import { ConfirmProvider } from '@shared/ui';

const renderScreen = () => render(<ConfirmProvider><AdminUserManagement /></ConfirmProvider>);

const user = { id: '3f2c1b9a-8d7e-4f6a-9b0c-1d2e3f4a5b6c', phoneNumber: '8000000001', roles: ['CUSTOMER'], active: true };

describe('AdminUserManagement search', () => {
  beforeEach(() => get.mockReset().mockResolvedValue({ data: user }));

  const search = (text: string) =>
    fireEvent.change(screen.getByPlaceholderText('User ID / Phone'), { target: { value: text } });

  it('finds a user by the phone number they sign in with', async () => {
    renderScreen();
    search('+91 80000 00001');
    await waitFor(() => expect(get).toHaveBeenCalledWith(
      '/api/v1/internal/admin/users/by-phone', { queries: { phone: '8000000001' } }));
    expect(await screen.findByText('8000000001')).toBeInTheDocument();
  });

  it('still finds a user by id', async () => {
    renderScreen();
    search(user.id);
    await waitFor(() => expect(get).toHaveBeenCalledWith(
      '/api/v1/internal/admin/users/:id', expect.objectContaining({ params: { id: user.id } })));
  });

  it('sends nothing for a query that is neither', async () => {
    renderScreen();
    search('priya');
    expect(await screen.findByText('No Users Found')).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });
});
