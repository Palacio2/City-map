import { renderHook, act } from '@testing-library/react';
import { it, expect, vi, afterEach } from 'vitest';
import { useTimeTracker } from './useTimeTracker';
import { updateUserTime } from '@stats/api/statsApi';

vi.mock('@subscription/context/SubscriptionContext', () => ({ useSubscription: () => ({ isFree: false }) }));
vi.mock('@stats/api/statsApi', () => ({ updateUserTime: vi.fn(async () => {}) }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

it('does not count hidden time and resumes counting on visibility', () => {
  vi.useFakeTimers();
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const { unmount } = renderHook(useTimeTracker);
  act(() => { vi.advanceTimersByTime(30_000); });
  visibility.mockReturnValue('hidden');
  act(() => { document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(600_000); });
  expect(updateUserTime).toHaveBeenCalledExactlyOnceWith(30_000);
  visibility.mockReturnValue('visible');
  act(() => { document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(300_000); });
  expect(updateUserTime).toHaveBeenCalledTimes(2);
  unmount(); visibility.mockRestore();
});

it('does not submit elapsed time while an account tree is being removed', () => {
  vi.useFakeTimers();
  const { unmount } = renderHook(useTimeTracker);
  act(() => { vi.advanceTimersByTime(30_000); });
  unmount();
  expect(updateUserTime).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(300_000); });
  expect(updateUserTime).not.toHaveBeenCalled();
});

it('still submits periodic activity while mounted and removes its timer on cleanup', () => {
  vi.useFakeTimers();
  const { unmount } = renderHook(useTimeTracker);
  act(() => { vi.advanceTimersByTime(300_000); });
  expect(updateUserTime).toHaveBeenCalledExactlyOnceWith(300_000);
  unmount();
  act(() => { vi.advanceTimersByTime(300_000); });
  expect(updateUserTime).toHaveBeenCalledTimes(1);
});
