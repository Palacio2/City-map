import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

    const { data: groups, error: groupsError } = await supabase
      .from('field_groups')
      .select('*')
      .order('sort_order', { ascending: true });

    if (groupsError) throw groupsError;

    const { data: fields, error: fieldsError } = await supabase
      .from('fields_config')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible_form', true)
      .order('sort_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    const dynamicCategories = {};

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
            isPremiumField: f.parser_config?.isPremium || false, 
            isRealtorOnly: f.parser_config?.isRealtorOnly || false 
          };
        })
      };
    });

    return new Response(JSON.stringify(dynamicCategories), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 
    });
  }
});