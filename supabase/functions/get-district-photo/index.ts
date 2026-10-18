import { getDistrictDataClient, corsHeaders } from '../_shared/security.ts';
import { signDistrictPhoto } from '../_shared/districtPhoto.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return new Response(null, { status: 405, headers: corsHeaders });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response(null, { status: 400, headers: corsHeaders });
  try {
    const db = getDistrictDataClient();
    const { data, error } = await db.from('districts')
      .select('id, district_photos(photo_url,is_main), cities!inner(is_available)')
      .eq('id', id).eq('is_available', true).eq('cities.is_available', true).maybeSingle();
    if (error) throw error;
    const photos = data?.district_photos ?? [];
    const photo = photos.find(item => item.is_main) ?? photos[0];
    const signed = await signDistrictPhoto(db, photo?.photo_url, id);
    if (!signed) return new Response(null, { status: 404, headers: corsHeaders });
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: signed } });
  } catch {
    return new Response(null, { status: 503, headers: corsHeaders });
  }
});
