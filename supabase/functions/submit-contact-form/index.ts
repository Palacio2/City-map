import { publishableKey, secretKey, isAnonymousAuthorization } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { readJsonObject, RequestError } from '../_shared/request.ts';
import { contactRecord } from './validation.ts';
import { verifyContactCaptcha } from './captcha.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'private, no-store',
};
const send = (data: unknown, status = 200) => Response.json(data, { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return send({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const anon = publishableKey();
    const header = req.headers.get('Authorization');
    let userId: string | null = null;
    if (header && !isAnonymousAuthorization(header)) {
      if (!header.startsWith('Bearer ')) throw new RequestError('Unauthorized', 401);
      const auth = createClient(url, anon);
      const { data: { user }, error } = await auth.auth.getUser(header.slice(7));
      if (error || !user) throw new RequestError('Unauthorized', 401);
      userId = user.id;
    }
    const body = await readJsonObject(req);
    const record = contactRecord(body, userId, url);
    // The public contact form always requires a challenge. The in-app feedback
    // widget requires a verified account and retains its durable user quota.
    if (!userId || record.type === 'contact') await verifyContactCaptcha(body.captcha_token);
    const db = createClient(url, secretKey());
    const { data: allowed, error: quotaError } = await db.rpc('claim_contact_request', { p_email: record.email, p_user: userId });
    if (quotaError) throw quotaError;
    if (allowed !== true) throw new RequestError('Too many contact requests. Please try again later.', 429);
    const { data, error } = await db.from('contacts_messages').insert(record).select('id').single();
    if (error) throw error;
    return send({ success: true, id: data.id });
  } catch (error) {
    return send({ error: error instanceof RequestError ? error.message : 'Contact service unavailable' },
      error instanceof RequestError ? error.status : 503);
  }
});
