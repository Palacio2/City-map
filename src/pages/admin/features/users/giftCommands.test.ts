import { afterEach, expect, it, vi } from 'vitest';
import { createGiftCommands } from './giftCommands';

afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });

it('keeps the operation identity across a lost response and page reload', async () => {
  const send = vi.fn().mockRejectedValueOnce(new Error('lost response')).mockResolvedValue({ success: true });
  const first = createGiftCommands('admin', send);
  await expect(first('grant_subscription', 'target', 'premium', 30)).rejects.toThrow('lost response');
  const reloaded = createGiftCommands('admin', send);
  await reloaded('grant_subscription', 'target', 'premium', 30);
  expect(send.mock.calls[1][1].requestId).toBe(send.mock.calls[0][1].requestId);
  await reloaded('grant_subscription', 'target', 'premium', 30);
  expect(send.mock.calls[2][1].requestId).not.toBe(send.mock.calls[1][1].requestId);
});

it('coalesces duplicate clicks and blocks conflicting operations for the same recipient', async () => {
  let finish!: (value: unknown) => void;
  const send = vi.fn(() => new Promise(resolve => { finish = resolve; }));
  const run = createGiftCommands('admin', send);
  const first = run('grant_subscription', 'target', 'premium', 30);
  const second = run('grant_subscription', 'target', 'premium', 30);
  expect(second).toBe(first);
  await expect(run('revoke_gift', 'target')).rejects.toThrow('in progress');
  expect(send).toHaveBeenCalledTimes(1);
  finish({ success: true });
  await first;
});

it('isolates identities between administrators and changed gift parameters', async () => {
  const send = vi.fn().mockRejectedValue(new Error('offline'));
  await createGiftCommands('first', send)('grant_subscription', 'target', 'premium', 30).catch(() => {});
  await createGiftCommands('second', send)('grant_subscription', 'target', 'premium', 30).catch(() => {});
  await createGiftCommands('first', send)('grant_subscription', 'target', 'premium', 60).catch(() => {});
  expect(new Set(send.mock.calls.map(([, payload]) => payload.requestId)).size).toBe(3);
});

it('retains in-memory retry identity when browser storage is unavailable', async () => {
  const storage = { getItem: () => { throw new Error('disabled'); }, setItem: () => { throw new Error('disabled'); }, removeItem: () => {} };
  const send = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ success: true });
  const run = createGiftCommands('admin', send, storage);
  await run('revoke_gift', 'target').catch(() => {});
  await run('revoke_gift', 'target');
  expect(send.mock.calls[1][1].requestId).toBe(send.mock.calls[0][1].requestId);
});
