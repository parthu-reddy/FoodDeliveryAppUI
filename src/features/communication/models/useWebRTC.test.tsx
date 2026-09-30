import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebRTC } from './useWebRTC';

const mocks = vi.hoisted(() => ({
  activate: vi.fn(),
  deactivate: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
  getIceServers: vi.fn(),
  showError: vi.fn(),
  registerMediaStream: vi.fn(),
  cleanOrphanedChunks: vi.fn(),
}));

vi.mock('@/lib/tokenStore', () => ({
  getToken: () => 'webrtc-test-token',
  getUserProfile: () => ({ id: 'admin-fixture-id' }),
}));

vi.mock('@/lib/zodiosClients', () => ({
  chatApi: {
    turnCredential: {
      get: (...args: unknown[]) => mocks.getIceServers(...args),
    },
  },
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showError: mocks.showError }),
}));

vi.mock('@/lib/permissionCleanup', () => ({
  registerMediaStream: (...args: unknown[]) => mocks.registerMediaStream(...args),
}));

vi.mock('@/lib/offlineStorage', () => ({
  cleanOrphanedChunks: (...args: unknown[]) => mocks.cleanOrphanedChunks(...args),
  clearSessionData: vi.fn(),
  getChunks: vi.fn(),
  getPendingUploads: vi.fn(),
  saveChunk: vi.fn(),
  savePendingUpload: vi.fn(),
}));

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    connected = true;
    onConnect?: () => void;
    activate = mocks.activate;
    deactivate = mocks.deactivate;
    publish = mocks.publish;
    subscribe = mocks.subscribe;
  },
}));

class FixturePeerConnection {
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceConnectionState: RTCIceConnectionState = 'new';
  addTrack = vi.fn();
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'fixture-offer-sdp' });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  close = vi.fn();
}

describe('useWebRTC call setup', () => {
  let peerConnection: FixturePeerConnection;
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;

  beforeEach(() => {
    mocks.activate.mockReset();
    mocks.deactivate.mockReset();
    mocks.publish.mockReset();
    mocks.subscribe.mockReset();
    mocks.getIceServers.mockReset();
    mocks.getIceServers.mockResolvedValue({ iceServers: [] });
    mocks.showError.mockReset();
    mocks.registerMediaStream.mockReset();
    mocks.cleanOrphanedChunks.mockReset();
    mocks.cleanOrphanedChunks.mockResolvedValue(undefined);
    track.stop.mockReset();

    vi.stubGlobal('RTCPeerConnection', class extends FixturePeerConnection {
      constructor() {
        super();
        peerConnection = this;
      }
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a fresh peer connection current through microphone permission and publishes its offer', async () => {
    const { result } = renderHook(() => useWebRTC());

    await act(async () => {
      await result.current.startCall('customer-fixture-id', 'session-fixture-id');
    });

    expect(peerConnection.addTrack).toHaveBeenCalledWith(track, stream);
    expect(peerConnection.createOffer).toHaveBeenCalledOnce();
    expect(peerConnection.setLocalDescription).toHaveBeenCalledWith({
      type: 'offer', sdp: 'fixture-offer-sdp',
    });
    expect(mocks.publish).toHaveBeenCalledWith({
      destination: '/app/webrtc.signal/customer-fixture-id',
      body: JSON.stringify({
        sessionId: 'session-fixture-id',
        targetUserId: 'customer-fixture-id',
        type: 'OFFER',
        sdp: 'fixture-offer-sdp',
      }),
    });
    expect(result.current.callState).toBe('CALLING');
  });

  it('still stops a microphone stream granted after cleanup while permission was pending', async () => {
    let resolveMedia!: (value: MediaStream) => void;
    const delayedPermission = new Promise<MediaStream>((resolve) => {
      resolveMedia = resolve;
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockReturnValue(delayedPermission) },
    });
    const { result, unmount } = renderHook(() => useWebRTC());

    let callPromise!: Promise<void>;
    act(() => {
      callPromise = result.current.startCall('customer-fixture-id', 'session-fixture-id');
    });
    unmount();

    await act(async () => {
      resolveMedia(stream);
      await callPromise;
    });

    expect(track.stop).toHaveBeenCalledOnce();
    expect(peerConnection.close).toHaveBeenCalledOnce();
    expect(mocks.publish).not.toHaveBeenCalled();
  });
});
