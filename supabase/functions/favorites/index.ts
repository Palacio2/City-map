import { publishableKey } from '../_shared/keys.ts';
import { districtPhotoUrl } from '../_shared/districtPhoto.ts';
import { createClient } from "npm:@supabase/supabase-js@2.112.2";
import { getDistrictDataClient, getUserAccess, getFieldsConfig, stripRestrictedFields, type UserAccess } from '../_shared/security.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "private, no-store",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Необхідна авторизація");
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      publishableKey(),
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Неавторизований користувач");

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();
    const userId = user.id;

    if (action === "get") return await getFavorites(getDistrictDataClient(), userId, await getUserAccess(req));
    if (action === "add") return await addFavorite(supabaseClient, userId, req);
    if (action === "remove") return await removeFavorite(supabaseClient, userId, req);

    throw new Error("Невідома дія");

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server Error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getFavorites(supabaseClient: any, userId: string, access: UserAccess) {
  const fields = await getFieldsConfig();
  const { data, error } = await supabaseClient
    .from("favorite_districts")
    .select(`
      created_at,
      districts!inner (
        id, name, is_available,
        cities (name, countries (name)),
        district_photos (photo_url, description, is_main),
        district_filter_data (*)
      )
    `)
    .eq("user_id", userId)
    .eq("districts.is_available", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const favorites = data.map((fav: any) => {
    const d = Array.isArray(fav.districts) ? fav.districts[0] : fav.districts;
    if (!d) return null;

    let mainPhoto = null;
    if (Array.isArray(d.district_photos)) {
        mainPhoto = d.district_photos.find((p: any) => p.is_main) || d.district_photos[0];
    } else if (d.district_photos && typeof d.district_photos === 'object') {
        mainPhoto = d.district_photos;
    }

    const rawFilterData = Array.isArray(d.district_filter_data)
      ? d.district_filter_data[0]
      : d.district_filter_data;
    const filterData = rawFilterData ? { ...rawFilterData } : null;
    stripRestrictedFields(filterData, fields, access);

    return {
      id: d.id,
      name: d.name,
      country: d.cities?.countries?.name || "",
      city: d.cities?.name || "",
      photo_url: mainPhoto?.photo_url ? districtPhotoUrl(d.id) : null,
      photo_description: mainPhoto?.description || d.name,
      filterData,
      addedAt: fav.created_at
    };
  }).filter(Boolean);

  return new Response(JSON.stringify({ favorites }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function addFavorite(supabaseClient: any, userId: string, req: Request) {
  const { districtId } = await req.json();
  if (!districtId) throw new Error("Не вказано districtId");

  const { error } = await supabaseClient
    .from("favorite_districts")
    .insert({ user_id: userId, district_id: districtId });

  if (error) {
    if (error.code === '23505') {
      return new Response(
        JSON.stringify({ success: true, message: "Вже додано" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    throw error;
  }

  return new Response(
    JSON.stringify({ success: true, message: "Додано" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function removeFavorite(supabaseClient: any, userId: string, req: Request) {
  const { districtId } = await req.json();
  if (!districtId) throw new Error("Не вказано districtId");

  const { error } = await supabaseClient
    .from("favorite_districts")
    .delete()
    .eq("user_id", userId)
    .eq("district_id", districtId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: "Видалено" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
