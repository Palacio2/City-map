import { RequestError } from '../_shared/request.ts';

const actions = ['get_all', 'update_role', 'update_cities', 'update_tabs', 'delete_user', 'terminate_sessions'] as const;
type Action = typeof actions[number];
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function userManagementRequest(body: Record<string, unknown>, actorId: string) {
  if (!actions.includes(body.action as Action)) throw new RequestError('Invalid action');
  const action = body.action as Action;
  const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.toLowerCase() : body.targetUserId;
  if (action !== 'get_all' && (typeof targetUserId !== 'string' || !uuid.test(targetUserId))) throw new RequestError('Invalid target user');
  if (targetUserId === actorId.toLowerCase() && ['update_role', 'update_tabs', 'update_cities', 'delete_user'].includes(action)) {
    throw new RequestError('Cannot change your own administrative access or delete your own account', 403);
  }
  const raw = body.payload ?? {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new RequestError('Invalid payload');
  const payload = raw as Record<string, unknown>;
  if (action === 'update_role' && !['user', 'admin', 'super_admin'].includes(String(payload.role))) throw new RequestError('Invalid role');
  for (const [requestAction, key] of [['update_cities', 'cities'], ['update_tabs', 'tabs']]) {
    if (action !== requestAction) continue;
    const values = payload[key];
    if (!Array.isArray(values) || values.length > 500 || values.some(value => typeof value !== 'string'
      || (key === 'cities' ? !uuid.test(value) : !/^[a-z][a-z0-9_.-]{0,79}$/.test(value)))
      || new Set(values).size !== values.length) throw new RequestError(`Invalid ${key}`);
  }
  return { action, targetUserId: targetUserId as string, payload };
}
