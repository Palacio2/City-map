import { contactRecord } from '../functions/submit-contact-form/validation.ts';
import { readJsonObject, RequestError } from '../functions/_shared/request.ts';

function assert(value: unknown) { if (!value) throw new Error('Assertion failed'); }
const body = { name: 'User', email: 'user@example.org', message: 'Contact message', consent_accepted: true };
Deno.test('contact authorship comes only from the verified session and page secrets are dropped', () => {
  const row = contactRecord({ ...body, user_id: 'victim', page_url: 'https://example.org/profile?code=secret#access_token=secret' }, 'owner', 'https://db.example.org');
  assert(row.user_id === 'owner');
  assert(row.page_url === 'https://example.org/profile');
  assert(contactRecord({ ...body, user_id: 'victim' }, null, 'https://db.example.org').user_id === null);
});
Deno.test('contact rejects malformed types, oversize values and foreign screenshots', () => {
  for (const patch of [{ type: 'admin' }, { email: {} }, { name: 12 }, { message: 'a'.repeat(10001) },
    { consent_accepted: 'true' }, { screenshot_url: 'victim/image.jpg' }, { page_url: 'javascript:alert(1)' }]) {
    let rejected = false;
    try { contactRecord({ ...body, ...patch }, 'owner', 'https://db.example.org'); }
    catch (e) { rejected = e instanceof RequestError; }
    assert(rejected);
  }
});
Deno.test('JSON bounds apply to actual bytes even without Content-Length', async () => {
  for (const value of ['[]', 'null', '{', JSON.stringify({ message: 'a'.repeat(40) })]) {
    let rejected = false;
    try { await readJsonObject(new Request('https://example.org', { method: 'POST', body: value }), 32); }
    catch (e) { rejected = e instanceof RequestError; }
    assert(rejected);
  }
});
