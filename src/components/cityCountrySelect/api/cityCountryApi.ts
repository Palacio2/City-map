import { supabase } from '@supabaseClient';
import type { Country, City, SelectOption } from '../types';

const EDGE_FUNCTION_NAME = 'cityCountrySelect';

export const fetchCountries = async (): Promise<Country[]> => {
  const { data, error } = await supabase.functions.invoke(`${EDGE_FUNCTION_NAME}/countries`, {
    method: 'GET',
  });

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    value: item.name,
    label: item.name,
    is_available: item.is_available
  }));
};

export const fetchCitiesByCountry = async (country: string): Promise<City[]> => {
  if (!country) return [];

  const encodedName = encodeURIComponent(country);
  
  const { data, error } = await supabase.functions.invoke(`${EDGE_FUNCTION_NAME}/cities/${encodedName}`, {
    method: 'GET',
  });

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    value: item.name,
    name: item.name,
    is_available: item.is_available
  }));
};

export const createSelectOptions = (
  items: Array<{ value: string; name?: string; label?: string; is_available?: boolean }>
): SelectOption[] => {
  if (!Array.isArray(items)) return [];

  const available: SelectOption[] = [];
  const unavailable: SelectOption[] = [];

  items.forEach(item => {
    const option: SelectOption = {
      label: item.label || item.name || item.value,
      value: item.value,
      disabled: item.is_available === false 
    };

    if (item.is_available !== false) {
      available.push(option);
    } else {
      unavailable.push(option);
    }
  });

  return [...available, ...unavailable];
};