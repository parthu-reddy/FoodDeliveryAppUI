import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatWidget } from '@features/communication/components/ChatWidget';
import { useChatSession } from './useChatSession';

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  loadHistory: vi.fn(),
  user: { id: 'customer-1', role: 'CUSTOMER', name: 'Customer' },
  sendMessage: vi.fn(),
  sendImage: vi.fn(),
  sendTypingIndicator: vi.fn(),
  showError: vi.fn(),
  isConnected: false,
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
    isConnected: mocks.isConnected,
    sendMessage: mocks.sendMessage,
    sendImage: mocks.sendImage,
    sendTypingIndicator: mocks.sendTypingIndicator,
  }),
}));

vi.mock('@/contexts/CallContext', () => ({
  useCallContext: () => ({ startCall: vi.fn(), callState: null, callEndReason: null, isCaller: false }),
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showError: mocks.showError }),
}));

describe('useChatSession initialization', () => {
  beforeEach(() => {
    mocks.createSession.mockReset();
    mocks.loadHistory.mockReset();
    mocks.sendMessage.mockReset();
    mocks.sendImage.mockReset();
    mocks.sendTypingIndicator.mockReset();
    mocks.showError.mockReset();
    mocks.isConnected = false;
    mocks.sendMessage.mockReturnValue(true);
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('ends initialization before deferred history completes and retains the returned messages', async () => {
    mocks.createSession.mockResolvedValue({ success: true, data: { sessionId: 'session-123', participants: [] } });
    let resolveHistory: ((value: unknown) => void) | undefined;
    mocks.loadHistory.mockImplementation(() => new Promise(resolve => { resolveHistory = resolve; }));
    const { result } = renderHook(() => useChatSession({ orderId: 'order-123', isOpen: true, showError: mocks.showError }));
    await waitFor(() => {
      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.isLoading).toBe(false);
      expect(mocks.loadHistory).toHaveBeenCalledOnce();
    });
    const message = { id: 'saved-message', content: 'Earlier message', timestamp: '2026-09-29T10:00:00Z' };
    await act(async () => { resolveHistory?.({ success: true, data: { content: [message] } }); });
    expect(result.current.messages).toEqual([message]);
  });

  it('keeps the session usable and reports a history failure without restarting initialization', async () => {
    mocks.createSession.mockResolvedValue({ success: true, data: { sessionId: 'session-123', participants: [] } });
    mocks.loadHistory.mockRejectedValue(new Error('History unavailable'));
    const { result } = renderHook(() => useChatSession({ orderId: 'order-123', isOpen: true, showError: mocks.showError }));
    await waitFor(() => expect(mocks.showError).toHaveBeenCalledWith('Chat connected, but previous messages could not be loaded.'));
    expect(result.current.sessionId).toBe('session-123');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.sessionInitError).toBe(false);
    expect(mocks.createSession).toHaveBeenCalledOnce();
  });

  it('exposes a retry after session creation fails and retries the request', async () => {
    mocks.createSession.mockRejectedValue(new Error('HTTP 409'));

    const { result } = renderHook(() => useChatSession({
      orderId: 'order-123',
      isOpen: true,
      showError: vi.fn(),
    }));

    await waitFor(() => expect(result.current.sessionInitError).toBe(true));
    expect(result.current.sessionId).toBeNull();
    expect(mocks.createSession).toHaveBeenCalledTimes(1);

    act(() => result.current.retrySession());

    await waitFor(() => {
      expect(mocks.createSession).toHaveBeenCalledTimes(2);
      expect(result.current.sessionInitError).toBe(true);
    });
  });

  it('clears a prior order session and ignores its late response after the selected order changes', async () => {
    let resolveFirstRequest: ((value: unknown) => void) | undefined;
    mocks.createSession
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstRequest = resolve; }))
      .mockResolvedValueOnce({
        success: true,
        data: {
          sessionId: 'session-order-b',
          participants: [{ userId: 'restaurant-owner-b', entityType: 'RESTAURANT', displayName: 'Restaurant B' }],
        },
      });
    mocks.loadHistory.mockResolvedValue({ success: true, data: { content: [] } });

    const { result, rerender } = renderHook(
      ({ orderId }) => useChatSession({ orderId, isOpen: true, showError: vi.fn() }),
      { initialProps: { orderId: 'order-a' } },
    );

    await waitFor(() => expect(mocks.createSession).toHaveBeenCalledTimes(1));
    rerender({ orderId: 'order-b' });
    await waitFor(() => expect(mocks.createSession).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.sessionId).toBe('session-order-b'));

    await act(async () => {
      resolveFirstRequest?.({
        success: true,
        data: { sessionId: 'session-order-a', participants: [{ userId: 'customer-a', entityType: 'CUSTOMER' }] },
      });
    });

    expect(result.current.sessionId).toBe('session-order-b');
    expect(result.current.participants).toEqual([
      { userId: 'restaurant-owner-b', entityType: 'RESTAURANT', displayName: 'Restaurant B' },
    ]);
    expect(mocks.createSession).toHaveBeenNthCalledWith(1, '/api/v1/chat/sessions', { orderId: 'order-a' });
    expect(mocks.createSession).toHaveBeenNthCalledWith(2, '/api/v1/chat/sessions', { orderId: 'order-b' });
  });

  it('shows a retry action instead of silently leaving the composer disabled', async () => {
    mocks.createSession.mockRejectedValue(new Error('HTTP 409'));

    render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chat couldn’t connect. Your message has not been sent.',
    );
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mocks.createSession).toHaveBeenCalledTimes(2));
  });

  it('exposes the reconnect status after a session opens without a WebSocket connection', async () => {
    mocks.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: 'session-123', participants: [] },
    });
    mocks.loadHistory.mockResolvedValue({ success: true, data: { content: [] } });

    render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));

    expect(await screen.findByTestId('chat-reconnecting-status'))
      .toHaveTextContent('Reconnecting to chat server...');
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
  });

  it('keeps a line break on Shift+Enter and sends the complete text on Enter', async () => {
    mocks.isConnected = true;
    mocks.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: 'session-123', participants: [] },
    });
    mocks.loadHistory.mockResolvedValue({ success: true, data: { content: [] } });

    render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));

    const composer = await screen.findByPlaceholderText('Type a message...');
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: 'First line\nSecond line' } });
    expect(composer).toHaveValue('First line\nSecond line');
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: false });

    expect(mocks.sendMessage).toHaveBeenCalledWith('First line\nSecond line', 'TEXT');
    expect(composer).toHaveValue('');
  });

  it('keeps the composer text when the socket closes before publish', async () => {
    mocks.isConnected = true;
    mocks.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: 'session-123', participants: [] },
    });
    mocks.loadHistory.mockResolvedValue({ success: true, data: { content: [] } });
    mocks.sendMessage.mockReturnValue(false);

    render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));

    const composer = await screen.findByPlaceholderText('Type a message...');
    fireEvent.change(composer, { target: { value: 'Keep this message' } });
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: false });

    expect(composer).toHaveValue('Keep this message');
    expect(mocks.showError).toHaveBeenCalledWith(
      'Chat is reconnecting. Your message was not sent. Please try again when connected.',
    );
  });

  it('throttles typing indicators and disables both image controls at the four-image limit', async () => {
    mocks.isConnected = true;
    mocks.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: 'session-123', participants: [] },
    });
    mocks.loadHistory.mockResolvedValue({
      success: true,
      data: {
        content: Array.from({ length: 4 }, (_, index) => ({
          id: `image-${index}`,
          senderId: 'customer-1',
          senderName: 'Customer',
          senderType: 'CUSTOMER',
          messageType: 'IMAGE',
          content: `https://media.example.test/image-${index}.png`,
          timestamp: '2026-09-29T10:00:00Z',
        })),
      },
    });

    render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));

    const composer = await screen.findByPlaceholderText('Type a message...');
    await waitFor(() => expect(composer).toBeEnabled());
    fireEvent.change(composer, { target: { value: 'a' } });
    fireEvent.change(composer, { target: { value: 'ab' } });

    expect(mocks.sendTypingIndicator).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Take photo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Upload image from gallery' })).toBeDisabled();
  });

  it('shows an upload error when the image endpoint does not return a usable URL', async () => {
    mocks.isConnected = true;
    mocks.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: 'session-123', participants: [] },
    });
    mocks.loadHistory.mockResolvedValue({ success: true, data: { content: [] } });
    mocks.sendImage.mockResolvedValue(null);

    const { container } = render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));
    await screen.findByPlaceholderText('Type a message...');

    const galleryInput = container.querySelector(
      "input[type='file']:not([capture])",
    ) as HTMLInputElement;
    fireEvent.change(galleryInput, {
      target: { files: [new File(['image fixture'], 'attachment.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(mocks.sendImage).toHaveBeenCalledTimes(1));
    expect(mocks.showError).toHaveBeenCalledWith(
      'Could not upload that image. Check it is under 5MB and try again.',
    );
  });

  it('blocks text above the server limit and explains why it cannot be sent', async () => {
    mocks.isConnected = true;
    mocks.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: 'session-123', participants: [] },
    });
    mocks.loadHistory.mockResolvedValue({ success: true, data: { content: [] } });

    render(<ChatWidget orderId="abcdef123" />);
    fireEvent.click(screen.getByTestId('chat-launcher'));

    const composer = await screen.findByPlaceholderText('Type a message...');
    fireEvent.change(composer, { target: { value: 'x'.repeat(10_001) } });

    expect(screen.getByRole('button', { name: 'Messages can contain up to 10,000 characters' }))
      .toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Messages can contain up to 10,000 characters.');

    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: false });
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.showError).toHaveBeenCalledWith('Messages can contain up to 10,000 characters.');
  });
});
