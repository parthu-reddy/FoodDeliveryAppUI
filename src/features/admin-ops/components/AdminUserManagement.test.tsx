import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const remove = vi.fn();
const put = vi.fn();
const getActiveOrders = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  identityApi: {
    adminUser: {
      get: (...a: unknown[]) => get(...a),
      post: (...a: unknown[]) => post(...a),
      delete: (...a: unknown[]) => remove(...a),
      put: (...a: unknown[]) => put(...a),
    },
  },
  customerApi: { adminOrder: { get: (...a: unknown[]) => getActiveOrders(...a) } },
}));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => ({ showError: vi.fn(), showSuccess: vi.fn() }) }));
vi.mock('@/hooks/usePolling', () => ({ usePolling: () => ({ refetch: vi.fn() }) }));
// No 500 ms wait in a unit test: the debounce is not what is under test.
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (value: string) => value }));

import AdminUserManagement from './AdminUserManagement';
import { ConfirmProvider } from '@shared/ui';

const renderScreen = () => render(<ConfirmProvider><AdminUserManagement /></ConfirmProvider>);

const user = { id: '3f2c1b9a-8d7e-4f6a-9b0c-1d2e3f4a5b6c', phoneNumber: '8000000001', roles: ['CUSTOMER'], active: true };
const otherUser = { id: '4f2c1b9a-8d7e-4f6a-9b0c-1d2e3f4a5b6c', phoneNumber: '8000000002', roles: ['CUSTOMER'], active: false };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('AdminUserManagement search', () => {
  beforeEach(() => {
    get.mockReset().mockResolvedValue({ data: user });
    post.mockReset().mockResolvedValue({});
    remove.mockReset().mockResolvedValue({});
    put.mockReset().mockResolvedValue({});
    getActiveOrders.mockReset().mockResolvedValue({ data: { content: [] } });
  });

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

  it('limits role changes to supported roles and does not submit after the confirmation is cancelled', async () => {
    renderScreen();
    search(user.phoneNumber);
    const phone = await screen.findByText(user.phoneNumber);
    fireEvent.click(phone.closest('button')!);
    await screen.findByRole('heading', { name: 'User Details' });

    expect(screen.queryByPlaceholderText('NEW_ROLE')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    fireEvent.click(screen.getByRole('combobox', { name: 'New role' }));
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.getAttribute('data-value')))
      .toEqual(['ADMIN', 'CUSTOMER', 'RESTAURANT', 'DELIVERY']);
    expect(screen.getByRole('option', { name: 'CUSTOMER' })).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('option', { name: 'DELIVERY' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const dialog = await screen.findByRole('dialog', { name: 'Grant DELIVERY role?' });
    expect(post).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(post).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('does not request a status change when suspension confirmation is cancelled', async () => {
    renderScreen();
    search(user.phoneNumber);
    fireEvent.click((await screen.findByText(user.phoneNumber)).closest('button')!);

    fireEvent.click(await screen.findByRole('button', { name: 'Suspend User' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspend this user?' });
    expect(put).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(put).not.toHaveBeenCalled();
  });

  it('waits for the server before changing the displayed status and keeps it unchanged after a failed request', async () => {
    const request = deferred<Record<string, never>>();
    put.mockReturnValue(request.promise);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderScreen();
      search(user.phoneNumber);
      fireEvent.click((await screen.findByText(user.phoneNumber)).closest('button')!);
      const statusButton = await screen.findByRole('button', { name: 'Suspend User' });
      fireEvent.click(statusButton);
      fireEvent.click(within(await screen.findByRole('dialog', { name: 'Suspend this user?' }))
        .getByRole('button', { name: 'Suspend user' }));

      await waitFor(() => expect(put).toHaveBeenCalledWith(
        '/api/v1/internal/admin/users/:userId/status',
        { isActive: false },
        { params: { userId: user.id } },
      ));
      expect(statusButton).toBeDisabled();
      expect(screen.getByText('Active')).toBeInTheDocument();

      request.reject(new Error('status service unavailable'));
      await waitFor(() => expect(statusButton).not.toBeDisabled());
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Suspend User' })).toBeEnabled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('allows only one in-flight status request and does not let a stale failure replace a newly selected user', async () => {
    const request = deferred<Record<string, never>>();
    put.mockReturnValue(request.promise);
    get.mockReset()
      .mockResolvedValueOnce({ data: user })
      .mockResolvedValueOnce({ data: otherUser });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderScreen();
      search(user.phoneNumber);
      fireEvent.click((await screen.findByText(user.phoneNumber)).closest('button')!);
      const statusButton = await screen.findByRole('button', { name: 'Suspend User' });
      fireEvent.click(statusButton);
      fireEvent.click(within(await screen.findByRole('dialog', { name: 'Suspend this user?' }))
        .getByRole('button', { name: 'Suspend user' }));
      await waitFor(() => expect(put).toHaveBeenCalledTimes(1));

      // The synchronous guard is still needed when an input event races the disabled render.
      fireEvent.click(statusButton);
      expect(put).toHaveBeenCalledTimes(1);

      search(otherUser.phoneNumber);
      fireEvent.click((await screen.findByText(otherUser.phoneNumber)).closest('button')!);
      expect(screen.getByRole('button', { name: 'Activate User' })).toBeDisabled();

      request.reject(new Error('status service unavailable'));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Activate User' })).toBeEnabled());
      expect(screen.getByText(otherUser.id)).toBeInTheDocument();
      expect(put).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ignores delayed active orders from a user who is no longer selected', async () => {
    const firstOrders = deferred<{ data: { content: Array<Record<string, unknown>> } }>();
    const secondOrders = deferred<{ data: { content: Array<Record<string, unknown>> } }>();
    get.mockImplementation((path: string, options?: { queries?: { phone?: string } }) => {
      if (path === '/api/v1/internal/admin/users/by-phone') {
        return Promise.resolve({ data: options?.queries?.phone === otherUser.phoneNumber ? otherUser : user });
      }
      throw new Error(`Unexpected identity request: ${path}`);
    });
    getActiveOrders.mockImplementation((_path: string, options: { params: { userId: string } }) =>
      options.params.userId === user.id ? firstOrders.promise : secondOrders.promise);

    renderScreen();
    search(user.phoneNumber);
    fireEvent.click((await screen.findByText(user.phoneNumber)).closest('button')!);
    await waitFor(() => expect(getActiveOrders).toHaveBeenCalledTimes(1));

    search(otherUser.phoneNumber);
    fireEvent.click((await screen.findByText(otherUser.phoneNumber)).closest('button')!);
    await waitFor(() => expect(getActiveOrders).toHaveBeenCalledTimes(2));

    secondOrders.resolve({
      data: {
        content: [{
          id: '11111111-1111-4111-8111-111111111111',
          restaurantName: 'Fixture B Kitchen',
          status: 'ACCEPTED',
          createdAt: '2026-09-29T10:00:00Z',
        }],
      },
    });
    expect(await screen.findByText('Fixture B Kitchen')).toBeInTheDocument();

    await act(async () => {
      firstOrders.resolve({
        data: {
          content: [{
            id: '22222222-2222-4222-8222-222222222222',
            restaurantName: 'Fixture A Kitchen',
            status: 'ACCEPTED',
            createdAt: '2026-09-29T10:00:00Z',
          }],
        },
      });
      await firstOrders.promise;
    });

    expect(screen.getByText('Fixture B Kitchen')).toBeInTheDocument();
    expect(screen.queryByText('Fixture A Kitchen')).not.toBeInTheDocument();
  });
});
