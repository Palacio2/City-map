import { supabase } from '@supabaseClient';

export const saveComparison = async (selectedDistricts) => {
  try {
    const payload = selectedDistricts.map(d => ({
      name: d.name,
      city: d.city,
      country: d.country,
      priceRent: d.filterData?.general?.rentalPrice || 0,
      priceSale: d.filterData?.general?.salePriceSqm || 0
    }));

    const { error } = await supabase.rpc('register_comparison_event', {
      districts_payload: payload
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Comparison Save Error:", err.message);
    throw new Error("Не вдалося зберегти результат порівняння");
  }
};