import { AccessError, authorizeDistrictBatch, requireAction } from '../../shared/authorization.js';

export const authorizeResults = async (supabase, access, rows) => authorizeDistrictBatch(access, rows, async ids => {
    const { data, error } = await supabase.from('districts').select('id, city_id, name').in('id', ids);
    if (error) throw error;
    return data;
});

export function scopeParserJobs(query, access, userId) {
    requireAction(access, 'parser');
    if (access.role === 'super_admin') return query;
    if (!userId) throw new AccessError('Missing job owner');
    return query.eq('config->>requestedBy', userId).in('config->>cityId', access.assignedCities);
}

export async function authorizeParserConfig(supabase, access, userId, input) {
    requireAction(access, 'parser.run_offline');
    if (!userId) throw new AccessError('Missing job owner');
    const districts = await authorizeResults(supabase, access, input.districts);
    const cityIds = [...new Set(districts.map(d => d.city_id))];
    if (cityIds.length !== 1) throw new AccessError('A parser job must belong to one city');
    const { data: city, error } = await supabase.from('cities').select('id, name').eq('id', cityIds[0]).single();
    if (error) throw error;
    if (!city) throw new AccessError('Unknown city');
    const config = { ...input, cityId: city.id, cityName: city.name, requestedBy: userId,
        districts: districts.map(d => ({ id: d.id, name: d.name })) };
    for (const key of ['jobId', 'results', 'status', 'progress', 'error']) delete config[key];
    return config;
}
