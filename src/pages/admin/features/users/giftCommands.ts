type GiftAction = 'grant_subscription' | 'revoke_gift';
type Send = (action: GiftAction, payload: Record<string, unknown>) => Promise<unknown>;
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function browserStorage(): Storage | undefined {
  try { return window.sessionStorage; } catch { return undefined; }
}

// Retain uncertain requests after network errors, including a page reload in the
// same tab. Only an acknowledged success starts a new administrative operation.
export function createGiftCommands(actorId: string | undefined, send: Send, storage = browserStorage()) {
  const requestIds = new Map<string, string>();
  const running = new Map<string, { key: string; promise: Promise<unknown> }>();
  return (action: GiftAction, userId: string, plan?: string, days?: number): Promise<unknown> => {
    if (!actorId) return Promise.reject(new Error('Admin identity unavailable'));
    const target = userId.toLowerCase();
    const key = 'city-map:gift:' + JSON.stringify([actorId, action, target, plan ?? null, days ?? null]);
    const active = running.get(target);
    if (active) return active.key === key ? active.promise : Promise.reject(new Error('Gift operation in progress'));
    let requestId = requestIds.get(key);
    if (!requestId) {
      try {
        const saved = storage?.getItem(key);
        if (saved && uuid.test(saved)) requestId = saved;
      } catch { /* In-memory retry protection remains available. */ }
      requestId ??= crypto.randomUUID();
      requestIds.set(key, requestId);
      try { storage?.setItem(key, requestId); } catch { /* Storage can be disabled. */ }
    }
    const payload = { userId: target, requestId, ...(action === 'grant_subscription' ? { plan_name: plan, days } : {}) };
    const promise = Promise.resolve().then(() => send(action, payload)).then(result => {
      requestIds.delete(key);
      try { storage?.removeItem(key); } catch { /* A receipt retained on disk is safe to replay. */ }
      return result;
    }).finally(() => { running.delete(target); });
    running.set(target, { key, promise });
    return promise;
  };
}
