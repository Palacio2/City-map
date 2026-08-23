import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabaseAdmin, isSuperAdmin, hasTab, user } = await verifyAdminUser(req);

    const { data: profile } = await supabaseAdmin
      .from("admin_profiles")
      .select("assigned_cities")
      .eq("user_id", user.id)
      .maybeSingle();

    const adminCityIds = profile?.assigned_cities || [];

    let stats = {
      totalCountries: 0,
      totalCities: 0,
      totalDistricts: 0,
      publishedDistricts: 0,
      problematicDistricts: [] as any[],
      outdatedDistricts: [] as any[]
    };

    const shouldFetchDistricts = isSuperAdmin || (adminCityIds && adminCityIds.length > 0);

    if (shouldFetchDistricts) {
      let districtQuery = supabaseAdmin.from("districts").select(`
        id, name, is_available, updated_at, city_id, cities(name, country_id),
        district_filter_data(*),
        district_photos(id),
        district_geo_data(geojson)
      `);

      if (!isSuperAdmin) {
        districtQuery = districtQuery.in("city_id", adminCityIds);
      }

      const { data: districts, error: distErr } = await districtQuery;
      if (distErr) throw distErr;

      const uniqueCountries = new Set();
      const uniqueCities = new Set();
      const problematicDistricts: any[] = [];
      const outdatedDistricts: any[] = [];
      let publishedDistricts = 0;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      districts?.forEach((d: any) => {
        if (d.cities?.country_id) uniqueCountries.add(d.cities.country_id);
        if (d.city_id) uniqueCities.add(d.city_id);

        if (d.is_available) publishedDistricts++;

        const photoObj = d.district_photos;
        const hasPhoto = Array.isArray(photoObj) ? photoObj.length > 0 : !!photoObj;

        const geoObj = d.district_geo_data;
        const hasGeo = Array.isArray(geoObj) 
          ? geoObj.length > 0 && !!geoObj[0]?.geojson 
          : !!geoObj?.geojson;

        const filterObj = d.district_filter_data;
        const fData = Array.isArray(filterObj) ? filterObj[0] : filterObj;
        const lastUpdatedStr = fData?.data_updated_at || fData?.last_updated || d.updated_at || null;

        const baseDistrict = {
          id: d.id,
          name: d.name,
          cityName: d.cities?.name || "Невідомо",
          cityId: d.city_id,
          countryId: d.cities?.country_id,
          isAvailable: d.is_available,
          lastUpdated: lastUpdatedStr
        };

        if (!hasPhoto || !hasGeo) {
          problematicDistricts.push({ ...baseDistrict, missingPhoto: !hasPhoto, missingGeo: !hasGeo });
        }

        if (d.is_available && (!lastUpdatedStr || new Date(lastUpdatedStr) < sixMonthsAgo)) {
          outdatedDistricts.push(baseDistrict);
        }
      });

      stats = {
        totalCountries: uniqueCountries.size,
        totalCities: uniqueCities.size,
        totalDistricts: districts?.length || 0,
        publishedDistricts,
        problematicDistricts,
        outdatedDistricts
      };
    }

    let chartData: any[] = [];
    {
      const { data: usersData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
      if (authErr) throw authErr;
      
      const usersList = usersData?.users || [];
      
      let days = 7;
      try {
        if (req.body) {
          const body = await req.clone().json();
          if (body.days) days = parseInt(body.days, 10);
        }
      } catch (e) {
        // ignore JSON parse error if body is empty
      }
      
      const periodDays = [...Array(days)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - ((days - 1) - i));
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
      });

      chartData = periodDays.map(dateStr => {
        const [, month, day] = dateStr.split("-");
        return {
          label: `${day}.${month}`,
          value: usersList.filter((u: any) => u.created_at?.startsWith(dateStr)).length
        };
      });
    }

    return new Response(JSON.stringify({ stats, chartData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Error", details: error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});