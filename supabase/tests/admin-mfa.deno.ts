import { requireVerifiedMfa } from '../../shared/authorization.js';

Deno.test('admin assurance rejects password-only sessions even when user metadata claims MFA', () => {
  for (const payload of [{ aal: 'aal1', user_metadata: { aal: 'aal2' } }, {}, { aal: null }]) {
    let rejected = false;
    try { requireVerifiedMfa(`header.${btoa(JSON.stringify(payload))}.verified`); }
    catch { rejected = true; }
    if (!rejected) throw new Error('Expected MFA rejection');
  }
  requireVerifiedMfa(`header.${btoa(JSON.stringify({ aal: 'aal2' }))}.verified`);
});
