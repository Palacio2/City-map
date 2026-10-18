import { userManagementRequest } from '../functions/admin-users-manage/validation.ts';
import { RequestError } from '../functions/_shared/request.ts';
const actor = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
function assert(value: unknown) { if (!value) throw new Error('Assertion failed'); }
Deno.test('admin user management blocks self access changes on the server', () => {
  for (const action of ['update_role', 'update_tabs', 'update_cities', 'delete_user']) {
    let denied = false;
    try { userManagementRequest({ action, targetUserId: actor }, actor); }
    catch (error) { denied = error instanceof RequestError && error.status === 403; }
    assert(denied);
  }
});
Deno.test('admin user requests reject missing IDs, invalid roles and malformed assignment arrays', () => {
  for (const request of [
    { action: 'delete_user' }, { action: 'unknown', targetUserId: target },
    { action: 'update_role', targetUserId: target, payload: 'admin' },
    { action: 'update_role', targetUserId: target, payload: { role: 'root' } },
    { action: 'update_tabs', targetUserId: target, payload: { tabs: ['users', 'users'] } },
    { action: 'update_cities', targetUserId: target, payload: { cities: ['*'] } },
  ]) {
    let rejected = false;
    try { userManagementRequest(request, actor); } catch { rejected = true; }
    assert(rejected);
  }
  assert(userManagementRequest({ action: 'update_role', targetUserId: target, payload: { role: 'admin' } }, actor).payload.role === 'admin');
});
