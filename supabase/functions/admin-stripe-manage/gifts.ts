import type { verifyAdminUser } from '../_shared/auth.ts';

export class GiftError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export async function manageGift(
  action: 'grant_subscription' | 'revoke_gift',
  payload: Record<string, unknown>,
  access: Awaited<ReturnType<typeof verifyAdminUser>>,
) {
  const { supabaseAdmin: db, user, isSuperAdmin, hasTab } = access;
  if (!hasTab('users.gift_sub')) throw new GiftError('Forbidden', 403);
  const requestId = payload.requestId;
  if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(requestId)) {
    throw new GiftError('Invalid gift request identity');
  }
  const ids = [payload.targetUserId, payload.userId, payload.user_id].filter(value => value !== undefined);
  const target = ids[0];
  if (typeof target !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(target)
    || ids.some(value => value !== target)) throw new GiftError('Invalid user');
  const plan = payload.planName ?? payload.plan_name;
  const days = payload.days;
  if (action === 'grant_subscription' && (
    !['premium', 'realtor'].includes(String(plan)) || typeof days !== 'number'
    || !Number.isInteger(days) || days < 1 || days > 365
    || (payload.planName !== undefined && payload.plan_name !== undefined && payload.planName !== payload.plan_name)
  )) throw new GiftError('Invalid gift plan or duration');

  const { data: profile, error: profileError } = await db.from('admin_profiles')
    .select('role').eq('user_id', target).maybeSingle();
  if (profileError) throw new GiftError('Unable to verify target permissions', 503);
  if (profile && !['user', 'admin', 'super_admin'].includes(profile.role)) throw new GiftError('Forbidden', 403);
  if (profile && profile.role !== 'user' && !isSuperAdmin) throw new GiftError('Forbidden', 403);

  const { data, error } = await db.rpc('manage_manual_gift', {
    p_request_id: requestId.toLowerCase(),
    p_actor: user.id, p_target: target.toLowerCase(), p_action: action,
    p_plan: action === 'grant_subscription' ? plan : null,
    p_days: action === 'grant_subscription' ? days : null,
  });
  if (error) {
    if (error.code === 'CM409') throw new GiftError('Gift request identity conflict', 409);
    if (error.code === '42501') throw new GiftError('Forbidden', 403);
    if (error.code === '22023') throw new GiftError('Invalid gift request');
    throw new GiftError('Unable to apply gift transaction', 503);
  }
  if (data?.success !== true || data?.source !== 'gift') throw new GiftError('Invalid gift transaction response', 503);
  return { success: true, source: 'gift' };
}
