import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoLock } from '@/hooks/useAutoLock';

describe('useAutoLock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onLock after timeout expires', () => {
    const onLock = vi.fn();

    renderHook(() => useAutoLock({ timeoutMinutes: 1, onLock, enabled: true }));

    expect(onLock).not.toHaveBeenCalled();

    // Advance past the 1-minute timeout
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('does not call onLock before timeout', () => {
    const onLock = vi.fn();

    renderHook(() => useAutoLock({ timeoutMinutes: 5, onLock, enabled: true }));

    act(() => {
      vi.advanceTimersByTime(4 * 60_000); // 4 minutes
    });

    expect(onLock).not.toHaveBeenCalled();
  });

  it('does not lock when disabled', () => {
    const onLock = vi.fn();

    renderHook(() => useAutoLock({ timeoutMinutes: 1, onLock, enabled: false }));

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });

  it('does not lock when timeoutMinutes is 0', () => {
    const onLock = vi.fn();

    renderHook(() => useAutoLock({ timeoutMinutes: 0, onLock, enabled: true }));

    act(() => {
      vi.advanceTimersByTime(600_000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });

  it('resets timer on user activity', () => {
    const onLock = vi.fn();

    renderHook(() => useAutoLock({ timeoutMinutes: 1, onLock, enabled: true }));

    // Advance 50 seconds
    act(() => {
      vi.advanceTimersByTime(50_000);
    });

    // Simulate user activity
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    // Advance another 50 seconds (total 100s from activity, but only 50s since reset)
    act(() => {
      vi.advanceTimersByTime(50_000);
    });

    // Should NOT have locked — only 50s since last activity
    expect(onLock).not.toHaveBeenCalled();

    // Advance remaining 10 seconds to hit 60s since activity
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const onLock = vi.fn();

    const { unmount } = renderHook(() => useAutoLock({ timeoutMinutes: 1, onLock, enabled: true }));

    unmount();

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });

  it('cleans up when transitioning from enabled to disabled', () => {
    const onLock = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) => useAutoLock({ timeoutMinutes: 1, onLock, enabled }),
      { initialProps: { enabled: true } }
    );

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // Disable
    rerender({ enabled: false });

    // Advance well past timeout
    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });
});
