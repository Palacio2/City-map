import { RequestError } from '../_shared/request.ts';

export async function verifyContactCaptcha(token: unknown) {
  const secret = Deno.env.get('CONTACT_TURNSTILE_SECRET_KEY');
  const hosts = (Deno.env.get('CONTACT_TURNSTILE_HOSTNAMES') ?? '').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
  if (!secret || hosts.length === 0) throw new RequestError('Contact verification unavailable',503);
  if (typeof token !== 'string' || !token.trim() || token.length>2048) throw new RequestError('Contact verification required',400);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret,response:token}),signal:AbortSignal.timeout(8000),redirect:'error',
    });
    if (!response.ok) throw new Error('Verification service unavailable');
    const data = await response.json();
    if (data?.success !== true || data.action !== 'contact'
      || typeof data.hostname !== 'string' || !hosts.includes(data.hostname.toLowerCase())) {
      throw new RequestError('Contact verification failed',400);
    }
  } catch(error) {
    if(error instanceof RequestError) throw error;
    throw new RequestError('Contact verification unavailable',503);
  }
}
