import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatWebSocket } from './useChatWebSocket';

const mocks = vi.hoisted(() => ({
  activate: vi.fn(),
  deactivate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/tokenStore', () => ({
  getToken: () => 'chat-test-token',
}));

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    connected = false;
    activate = mocks.activate;
    deactivate = mocks.deactivate;
    publish = vi.fn();
    subscribe = vi.fn();
  },
}));

describe('useChatWebSocket image upload', () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.activate.mockReset();
    mocks.deactivate.mockReset();
    vi.stubGlobal('fetch', mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the generated UploadResponseDto url field after a successful upload', async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          url: 'https://media.example.test/chat/attachment.png',
          messageId: 'message-123',
        },
      }),
    });

    const { result } = renderHook(() => useChatWebSocket({
      sessionId: 'session-123',
      onMessageReceived: vi.fn(),
      onTypingIndicator: vi.fn(),
    }));

    let uploadUrl: string | null | undefined;
    await act(async () => {
      uploadUrl = await result.current.sendImage(
        new File(['image fixture'], 'attachment.png', { type: 'image/png' }),
      );
    });

    expect(uploadUrl).toBe('https://media.example.test/chat/attachment.png');
    expect(mocks.fetch).toHaveBeenCalledWith(
      '/api/v1/chat/sessions/session-123/upload-image',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer chat-test-token',
          'X-Calling-Service': 'CustomerApplication',
        },
      }),
    );
  });

  it('does not report success when the upload response has no URL', async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { messageId: 'message-123' } }),
    });

    const { result } = renderHook(() => useChatWebSocket({
      sessionId: 'session-123',
      onMessageReceived: vi.fn(),
      onTypingIndicator: vi.fn(),
    }));

    await expect(result.current.sendImage(
      new File(['image fixture'], 'attachment.png', { type: 'image/png' }),
    )).resolves.toBeNull();
  });
});
