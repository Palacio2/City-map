import { getDistrictDataClient, getUserAccess, getFieldsConfig, stripRestrictedFields, corsHeaders } from '../_shared/security.ts';
import { collectPages } from '../_shared/pagination.ts';
import { districtPhotoUrl } from '../_shared/districtPhoto.ts';
import { prepareDistrictFilters, matchesDistrictFilters } from '../_shared/districtSearch.ts';
import { RequestError } from '../_shared/request.ts';





Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json', Allow: 'GET, POST, OPTIONS' },
    });
  }

  try {
    const supabase = getDistrictDataClient();

    const url = new URL(req.url);
    let countryName = url.searchParams.get('country') || '';
    let cityName = url.searchParams.get('city') || '';
    let idsParam = url.searchParams.get('ids');
    let filtersParam = url.searchParams.get('filters');
    let includeTotals = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.country) countryName = body.country;
        if (body.city) cityName = body.city;
        if (body.ids) idsParam = body.ids;
        if (body.filters) filtersParam = body.filters;
        includeTotals = body.includeTotals === true;
      } catch (e) {
        // body might be empty
      }
    }

    // SECURITY: Get user access level
    const access = await getUserAccess(req);

    let orderedIds: string[] = [];

    if (!idsParam && countryName && cityName) {
        const { data: popularIds, error: rpcError } = await supabase.rpc('get_popular_district_ids', {
            city_name: cityName,
            country_name: countryName
        });

        if (!rpcError && popularIds && popularIds.length > 0) {
            orderedIds = popularIds.map((item: any) => item.id);

            // Popular IDs determine ordering only, never the city membership.
        }
    } else if (idsParam) {
        orderedIds = idsParam.split(',');
    }

    let filtersObj: any = {};
    if (filtersParam) {
      try {
        filtersObj = typeof filtersParam === 'string' ? JSON.parse(filtersParam) : filtersParam;
      } catch { throw new RequestError('Invalid search filters'); }
    }

    const withFilters = filtersObj === true || Object.keys(filtersObj ?? {}).length > 0 || !!idsParam || !!(countryName && cityName);
    if (filtersObj === true) filtersObj = {};
    const fieldsConfig = await getFieldsConfig();
    const searchFilters = prepareDistrictFilters(filtersObj, fieldsConfig, access);

    if (!idsParam && (!countryName || !cityName)) {
      return new Response(JSON.stringify({ error: 'Params required: ids OR (country, city)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let selectQuery = `
      id, name, is_available, updated_at,
      district_photos(photo_url, is_main, description),
      cities!inner(name, countries!inner(name))
    `;

    if (withFilters) {
      selectQuery += `, district_filter_data(*)`;
    }

    let query = supabase
      .from('districts')
      .select(selectQuery)
      .eq('is_available', true);

    if (idsParam) {
        const ids = idsParam.split(',');
        query = query.in('id', ids);
    } else {
        query = query
          .eq('cities.name', cityName)
          .eq('cities.countries.name', countryName);
    }

    const districts = await collectPages<any>(async (offset, size) => {
      const { data, error } = await query.order('id').range(offset, offset + size - 1);
      if (error) throw error;
      return data ?? [];
    });

    // Get fields configuration to know what to strip

    let result = districts.map((d: any) => {
      let mainPhoto = null;
      if (Array.isArray(d.district_photos)) {
          mainPhoto = d.district_photos.find((p: any) => p.is_main) || d.district_photos[0];
      } else if (d.district_photos && typeof d.district_photos === 'object') {
          mainPhoto = d.district_photos;
      }

      let f = null;
      if (withFilters && d.district_filter_data) {
        const raw = Array.isArray(d.district_filter_data) ? d.district_filter_data[0] : d.district_filter_data;
        f = raw ? { ...raw } : null;

        // SECURITY: Strip restricted fields
        stripRestrictedFields(f, fieldsConfig, access);
      }

      const bestDate = f?.data_updated_at || f?.last_updated || d.updated_at;

      const item: any = {
        id: d.id,
        name: d.name,
        city: d.cities?.name,
        country: d.cities?.countries?.name,
        available: d.is_available,
        photo_url: mainPhoto?.photo_url ? districtPhotoUrl(d.id) : null,
        photo_description: mainPhoto?.description || d.name,
        updated_at: bestDate,
      };

      if (f) {
          item.filterData = f;
      }

      return item;
    }).filter((item: any) => matchesDistrictFilters(item.filterData, searchFilters));

    if (orderedIds.length > 0) {
        result.sort((a: any, b: any) => {
            const indexA = orderedIds.indexOf(a.id);
            const indexB = orderedIds.indexOf(b.id);

            const valA = indexA === -1 ? 9999 : indexA;
            const valB = indexB === -1 ? 9999 : indexB;

            return valA - valB;
        });
    } else {

        result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }



    const visibleResults = access.isFree ? result.slice(0, 5) : result;
    return new Response(JSON.stringify(includeTotals ? { districts: visibleResults, total: result.length, originalTotal: districts.length } : visibleResults), {
      headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-store'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error instanceof RequestError ? error.message : 'District search unavailable' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error instanceof RequestError ? error.status : 503
    });
  }
});
