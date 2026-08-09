import { supabase } from '@supabaseClient';
import type { TransformedDistrict } from '@utils/dataTransformers';

export const saveComparison = async (selectedDistricts: TransformedDistrict[]): Promise<boolean> => {
  const payload = selectedDistricts.map(d => ({
    name: d.name || '',
    city: String((d as Record<string, unknown>).city || ''),
    country: String((d as Record<string, unknown>).country || ''),
    priceRent: Number(d.filterData?.general?.average_rent_price) || 0,
    priceSale: Number(d.filterData?.general?.propertyPrice) || 0
  }));

  const { error } = await supabase.rpc('register_comparison_event', {
    districts_payload: payload
  });

  if (error) throw new Error(error.message);
  return true;
};