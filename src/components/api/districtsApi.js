import { authenticatedApiRequest } from './apiClient';

export async function fetchDistrictsWithFilters(country, city, withFilters = true) {
  const params = new URLSearchParams({ 
    country, 
    city, 
    filters: withFilters.toString()
  });
  
  return await authenticatedApiRequest(`/get-districts?${params.toString()}`);
}


export const fetchDistrictsByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];

  const idsString = ids.join(',');
  const params = new URLSearchParams({
      ids: idsString
  });

  return await authenticatedApiRequest(`/get-districts?${params.toString()}`);
};