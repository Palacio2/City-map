import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequireAuth, requireTab, requireSuperAdminAccess } from './adminAuthorization.js';

test('fresh DB profile overrides stale JWT claims and permission revocation takes effect on next request', async () => {
    let profile = { role: 'admin', allowed_tabs: ['manual.save'], assigned_cities: ['own'] };
    let queries = 0;
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'actor', app_metadata: { role: 'super_admin' } } } }) },
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => { queries++; return { data: profile }; } }) }) }) };
    const auth = createRequireAuth(client);
    const invoke = async () => {
        const req = { headers: { authorization: `Bearer header.${btoa(JSON.stringify({ aal: 'aal2' }))}.verified-signature` } };
        const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
        let passed = false;
        await auth(req, res, () => { passed = true; });
        return { req, res, passed };
    };
    const first = await invoke();
    assert.equal(first.passed, true); assert.equal(first.req.adminAccess.role, 'admin');
    let actionPassed = false;
    requireTab('manual.save')(first.req, first.res, () => { actionPassed = true; });
    assert.equal(actionPassed, true);
    requireSuperAdminAccess(first.req, first.res, () => assert.fail('admin cannot deploy'));
    assert.equal(first.res.code, 403);
    profile = null;
    const second = await invoke();
    assert.equal(second.passed, false); assert.equal(second.res.code, 403); assert.equal(queries, 2);
});

test('database outage and malformed authorization fail closed', async () => {
    const auth = createRequireAuth({ auth: { getUser: async () => { throw new Error('private database detail'); } } });
    for (const [header, code] of [['Basic token', 401], ['Bearer token', 503]]) {
        const res = { status(value) { this.code = value; return this; }, json(body) { this.body = body; } };
        await auth({ headers: { authorization: header } }, res, () => assert.fail('must not authorize'));
        assert.equal(res.code, code); assert.ok(!res.body.error.includes('private'));
    }
});

test('password-only admin session is rejected before privileged database reads', async () => {
    const auth = createRequireAuth({ auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) },
      from: () => assert.fail('AAL1 must not read privileged data') });
    const res = { status(code) { this.code = code; return this; }, json() {} };
    await auth({ headers: { authorization: `Bearer header.${btoa(JSON.stringify({ aal: 'aal1' }))}.verified` } }, res,
      () => assert.fail('must require MFA'));
    assert.equal(res.code, 403);
});
