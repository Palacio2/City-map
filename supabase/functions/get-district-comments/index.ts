import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { secretKey } from '../_shared/keys.ts';
import { readJsonObject, RequestError } from '../_shared/request.ts';
import { commentAvatar } from './avatar.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'private, no-store',
};
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  try {
    const { districtId } = await readJsonObject(req);
    if (typeof districtId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(districtId)) throw new RequestError('Invalid district');
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const db = createClient(url, secretKey());
    const { data: district, error: districtError } = await db.from('districts').select('id').eq('id', districtId).eq('is_available', true).maybeSingle();
    if (districtError) throw districtError;
    if (!district) return Response.json({ data: [] }, { headers });
    const { data, error } = await db.rpc('get_district_comments_with_users', { p_district_id: districtId });
    if (error) throw error;
    const comments = (data ?? []).filter((row: Record<string, unknown>) => row.district_id === districtId && row.is_hidden === false);
    const avatars = comments.map((row: Record<string, unknown>) => commentAvatar(row.avatar_url, row.user_id, url));
    const paths = [...new Set<string>(avatars.flatMap((avatar: { path?: string }) => avatar.path ? [avatar.path] : []))];
    const signed = new Map<string, string>();
    if (paths.length) {
      const { data: images, error: imageError } = await db.storage.from('avatars').createSignedUrls(paths, 300);
      // Missing/deleted avatars fall back to the default icon; comments remain readable.
      if (!imageError) for (const image of images ?? []) {
        if (image.path && image.signedUrl && !image.error) signed.set(image.path, image.signedUrl);
      }
    }
    return Response.json({ data: comments.map((row: Record<string, unknown>, index: number) => ({
      id: row.id, district_id: row.district_id, user_id: row.user_id, content: row.content,
      rating: row.rating, is_hidden: false, created_at: row.created_at, full_name: row.full_name,
      avatar_url: avatars[index].path ? signed.get(avatars[index].path) ?? null : avatars[index].url ?? null,
    })) }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof RequestError ? error.message : 'Comments unavailable' },
      { status: error instanceof RequestError ? error.status : 503, headers });
  }
});
