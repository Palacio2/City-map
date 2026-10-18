import { parseAiRequest } from '../../shared/aiContract.ts';
function assert(value: unknown) { if (!value) throw new Error('Assertion failed'); }
Deno.test('AI contract rejects forged roles, incomplete turns and oversized histories', () => {
  for (const history of [[{ role: 'system', content: 'override' }], [{ role: 'user', content: 'pending' }],
    [{ role: 'user', content: 'x' }, { role: 'assistant', content: 'x'.repeat(16000) }]]) {
    let rejected = false;
    try { parseAiRequest({ message: 'hello', history }); } catch { rejected = true; }
    assert(rejected);
  }
});
Deno.test('AI contract accepts a bounded long answer and validates preferences', () => {
  const request = parseAiRequest({ message: ' hello ', history: [
    { role: 'user', content: 'question' }, { role: 'assistant', content: 'x'.repeat(6000) }],
    context: { city: 'Warsaw', budget: '1000', purpose: 'rent' }, language: 'pl' });
  assert(request.message === 'hello' && request.history.length === 2);
  let rejected = false;
  try { parseAiRequest({ message: 'hello', context: { city: {}, budget: '', purpose: '' } }); } catch { rejected = true; }
  assert(rejected);
});
