import { publishableKey } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let stage = 'client';
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, publishableKey());
    stage = 'groups';
    const { data: groups, error: groupsError } = await supabase
      .from('field_groups')
      .select('*')
      .order('sort_order', { ascending: true });

    if (groupsError) throw groupsError;

    stage = 'fields';
    const { data: fields, error: fieldsError } = await supabase
      .from('fields_config')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible_form', true)
      .order('sort_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    stage = 'mapping';
    const dynamicCategories: Record<string, {
      key: string; labelKey: string; icon: string; ratingDbKey: string; isPremium: boolean;
      fields: { key: string; dbKey: string; type: string; icon: string; isPremiumField: boolean; isRealtorOnly: boolean }[];
    }> = {};

    groups.forEach(group => {
      const groupFields = fields.filter(f => f.ui_group === group.id);
      if (groupFields.length === 0) return;

      let ratingDbKey = `${group.id}_rating`;
      if (group.id === 'utilities') ratingDbKey = 'utilities_quality_rating';

      dynamicCategories[group.id] = {
        key: group.id,
        labelKey: group.label_key, 
        icon: group.icon || '📌',
        ratingDbKey: ratingDbKey, 
        isPremium: false, 
        fields: groupFields.map(f => {

          let fieldType = 'text';
          if (f.data_type === 'boolean' || f.ui_component === 'checkbox') {
              fieldType = 'boolean';
          } else if (f.ui_component === 'input_number') {
              if (f.field_code.includes('price') || f.field_code.includes('cost')) {
                  fieldType = 'price';
              } else if (f.field_code.endsWith('_count')) {
                  fieldType = 'boolean'; 
              } else {
                  fieldType = 'number';
              }
          }

          if (f.field_code === 'crime_level') fieldType = 'crimeLevel';

          return {
            key: f.field_code, 
            dbKey: f.field_code, 
            type: fieldType,
            icon: f.icon,
            isPremiumField: f.is_premium === true,
            isRealtorOnly: f.is_realtor_only === true,
          };
        })
      };
    });

    return new Response(JSON.stringify(dynamicCategories), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    // Only a stage and allowlisted configuration name, never a credential or SQL detail.
    const configuration = error instanceof Error && /^(Invalid|Missing) SUPABASE_[A-Z_]+$/.test(error.message)
      ? error.message : 'unavailable';
    console.error('Filter configuration failed', { stage, configuration });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});
