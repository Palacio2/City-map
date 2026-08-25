import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";

export interface UserAccess {
  isFree: boolean;
  isPremium: boolean;
  isRealtor: boolean;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const getSupabaseClient = (authHeader: string | null) => {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  if (authHeader) {
    return createClient(url, key, { global: { headers: { Authorization: authHeader } } });
  }
  return createClient(url, key);
};

export const getUserAccess = async (req: Request): Promise<UserAccess> => {
  // 1. Check Global Env Override for promotions ("Free Week")
  if (Deno.env.get("UNLOCK_ALL_PREMIUM_FEATURES") === "true") {
    return {
      isFree: false,
      isPremium: true,
      isRealtor: Deno.env.get("UNLOCK_ALL_REALTOR_FEATURES") === "true"
    };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { isFree: true, isPremium: false, isRealtor: false };
  }

  const supabase = getSupabaseClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isFree: true, isPremium: false, isRealtor: false };
  }

  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select('plan_name, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: false })
    .limit(1);

  if (!subscriptions || subscriptions.length === 0) {
    return { isFree: true, isPremium: false, isRealtor: false };
  }

  const plan = subscriptions[0].plan_name?.toLowerCase().trim();
  const isPlanActive = true; 

  const premiumPlans = ['weekly', 'premium', 'realtor'];
  const isPremium = premiumPlans.includes(plan) && isPlanActive;
  const isRealtor = plan === 'realtor' && isPlanActive;

  return {
    isFree: !isPremium && !isRealtor,
    isPremium,
    isRealtor
  };
};

// Global cache for fields configuration
let fieldsConfigCache: any[] | null = null;
let fieldsConfigCacheTime = 0;
const FIELDS_CACHE_TTL = 3600 * 1000; // 1 hour

export const getFieldsConfig = async () => {
  if (fieldsConfigCache && Date.now() - fieldsConfigCacheTime < FIELDS_CACHE_TTL) {
    return fieldsConfigCache;
  }

  const supabase = getSupabaseClient(null); // anonymous client
  const { data: fields } = await supabase
    .from('fields_config')
    .select('field_code, parser_config')
    .eq('is_active', true);
  
  fieldsConfigCache = fields || [];
  fieldsConfigCacheTime = Date.now();
  return fieldsConfigCache;
};

export const stripRestrictedFields = (dataObj: any, fieldsConfig: any[], access: UserAccess) => {
  if (!dataObj || typeof dataObj !== 'object') return;

  for (const field of fieldsConfig) {
    const isPremiumField = field.parser_config?.isPremium || false;
    const isRealtorOnly = field.parser_config?.isRealtorOnly || false;

    let shouldStrip = false;
    
    if (access.isFree && isPremiumField) shouldStrip = true;
    if (!access.isRealtor && isRealtorOnly) shouldStrip = true;

    if (shouldStrip) {
      // Remove the exact field
      if (field.field_code in dataObj) {
        delete dataObj[field.field_code];
      }
      // Often there is a _count or _rating associated
      if (`${field.field_code}_count` in dataObj) {
        delete dataObj[`${field.field_code}_count`];
      }
    }
  }
};
