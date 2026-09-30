import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CallOverlay } from './CallOverlay';

const mocks = vi.hoisted(() => ({
  acceptCall: vi.fn(),
  declineCall: vi.fn(),
  endCall: vi.fn(),
  toggleMute: vi.fn(),
}));

const callState = vi.hoisted(() => ({ value: 'CALLING' as 'CALLING' | 'RINGING' }));

vi.mock('@/contexts/CallContext', () => ({
  useCallContext: () => ({
    callState: callState.value,
    callEndReason: null,
    remoteStream: null,
    acceptCall: mocks.acceptCall,
    declineCall: mocks.declineCall,
    endCall: mocks.endCall,
    toggleMute: mocks.toggleMute,
  }),
}));

describe('CallOverlay controls', () => {
  beforeEach(() => {
    callState.value = 'CALLING';
    mocks.acceptCall.mockReset();
    mocks.declineCall.mockReset();
    mocks.endCall.mockReset();
    mocks.toggleMute.mockReset();
    mocks.toggleMute.mockReturnValue(true);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  it('gives an outgoing caller labeled mute and end controls', () => {
    render(<CallOverlay />);

    expect(screen.getByRole('heading', { name: 'Calling...' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mute microphone' }));
    expect(mocks.toggleMute).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Unmute microphone' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End call' }));
    expect(mocks.endCall).toHaveBeenCalledOnce();
  });

  it('gives an incoming caller labeled accept and decline controls', () => {
    callState.value = 'RINGING';
    render(<CallOverlay />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept call' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decline call' }));
    expect(mocks.acceptCall).toHaveBeenCalledOnce();
    expect(mocks.declineCall).toHaveBeenCalledOnce();
  });
});
