import { verifyAdminUser, corsHeaders } from '../_shared/auth.ts';
import { requireCity, requireSuperAdmin, requireAction } from '../../../shared/authorization.js';
import { readJsonObject, RequestError } from '../_shared/request.ts';

Deno.serve(async req => {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  try {
    const access = await verifyAdminUser(req);
    const { action, payload } = await readJsonObject(req);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new RequestError('Invalid geography payload');
    const input = payload as Record<string, unknown>;
    switch (action) {
      case 'create_country': requireAction(access, 'manual.create.country'); break;
      case 'create_city': requireAction(access, 'manual.create.city'); break;
      case 'create_district': requireAction(access, 'manual.create.district'); requireCity(access, input.cityId); break;
      case 'create_districts': requireAction(access, 'manual.create.district', 'parser.create_districts'); requireCity(access, input.cityId); break;
      case 'import_geojson': requireAction(access, 'manual.gis', 'parser.import_geojson'); requireCity(access, input.cityId); break;
      case 'delete_country': requireSuperAdmin(access); break;
      case 'delete_city': requireAction(access, 'manual.delete'); requireCity(access, input.id); break;
      case 'delete_district': {
        requireAction(access, 'manual.delete', 'parser.delete_districts');
        const { data, error } = await access.supabaseAdmin.from('districts').select('city_id').eq('id', input.districtId).maybeSingle();
        if (error) throw error;
        if (!data) throw new RequestError('District not found', 404);
        requireCity(access, data.city_id);
        break;
      }
      default: throw new RequestError('Invalid action');
    }
    // The database rechecks permissions and scope, mutates all affected tables,
    // assigns newly created cities, and writes audit in a single transaction.
    const { data, error } = await access.supabaseAdmin.rpc('admin_geography_action', {
      p_actor: access.user.id, p_action: action, p_payload: payload,
    });
    if (error) throw error;
    return Response.json(data ?? { success: true }, { headers });
  } catch (error) {
    const value = error as { message?: string; status?: number; code?: string };
    const status = error instanceof RequestError ? error.status : value.status === 403 || value.code === '42501' || value.message?.startsWith('Forbidden:') ? 403 : 400;
    return Response.json({ error: error instanceof RequestError ? error.message : status === 403 ? 'Forbidden' : 'Geography operation failed' }, { status, headers });
  }
});
