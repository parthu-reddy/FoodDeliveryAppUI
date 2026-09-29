import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatWidget } from '@features/communication/components/ChatWidget';
import { useChatSession } from './useChatSession';

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  loadHistory: vi.fn(),
  user: { id: 'customer-1', role: 'CUSTOMER', name: 'Customer' },
}));

vi.mock('@/lib/zodiosClients', () => ({
  chatApi: {
    chatSession: {
      post: (...args: unknown[]) => mocks.createSession(...args),
      get: (...args: unknown[]) => mocks.loadHistory(...args),
    },
  },
}));

vi.mock('@/lib/tokenStore', () => ({
  getToken: () => 'test-token',
  getUserProfile: () => mocks.user,
}));

vi.mock('@features/communication/models/useChatWebSocket', () => ({
  useChatWebSocket: () => ({
    isConnected: false,
    sendMessage: vi.fn(),
    sendImage: vi.fn(),
    sendTypingIndicator: vi.fn(),
  }),
}));

vi.mock('@/contexts/CallContext', () => ({
  useCallContext: () => ({ startCall: vi.fn(), callState: null, callEndReason: null, isCaller: false }),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showError: vi.fn() }),
}));

describe('useChatSession initialization', () => {
  beforeEach(() => {
    mocks.createSession.mockReset();
    mocks.loadHistory.mockReset();
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('exposes a retry after session creation fails and retries the request', async () => {
    mocks.createSession.mockRejectedValue(new Error('HTTP 409'));

    const { result } = renderHook(() => useChatSession({
      orderId: 'order-123',
      isOpen: true,
      currentUserType: 'CUSTOMER',
      showError: vi.fn(),
    }));

    await waitFor(() => expect(result.current.sessionInitError).toBe(true));
    expect(result.current.sessionId).toBeNull();
    expect(mocks.createSession).toHaveBeenCalledTimes(1);

    act(() => result.current.retrySession());

    await waitFor(() => expect(mocks.createSession).toHaveBeenCalledTimes(2));
    expect(result.current.sessionInitError).toBe(true);
  });

  it('shows a retry action instead of silently leaving the composer disabled', async () => {
    mocks.createSession.mockRejectedValue(new Error('HTTP 409'));

    render(<ChatWidget orderId="abcdef123" currentUserType="CUSTOMER" />);
    fireEvent.click(screen.getByRole('button', { name: '#abcdef' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chat couldn’t connect. Your message has not been sent.',
    );
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mocks.createSession).toHaveBeenCalledTimes(2));
  });
});
