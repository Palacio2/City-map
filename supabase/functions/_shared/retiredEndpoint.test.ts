import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { retiredEndpoint } from './retiredEndpoint.ts';

for (const role of ['user', 'admin', 'super_admin']) {
  test(`legacy API rejects ${role} requests without touching backend services`, async () => {
    const request = new Request('https://example.test/update-admin-user', {
      method: 'POST',
      headers: { Authorization: 'Bearer unused', 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_role', targetUserId: 'self', value: role }),
    });
    const response = retiredEndpoint(request);
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.json()).error, 'ENDPOINT_RETIRED');
    assert.equal(request.bodyUsed, false);
  });
}

test('legacy read endpoint does not return users', async () => {
  const response = retiredEndpoint(new Request('https://example.test/get-admin-users'));
  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), {
    error: 'ENDPOINT_RETIRED', message: 'Use admin-users-manage.',
  });
});

test('CORS preflight succeeds without invoking an action', async () => {
  const response = retiredEndpoint(new Request('https://example.test/admin-users-list', { method: 'OPTIONS' }));
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.match(response.headers.get('Access-Control-Allow-Headers') ?? '', /authorization/);
});
