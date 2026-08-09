// @ts-nocheck
import { authenticatedApiRequest } from './apiClient';

export async function fetchDistrictsWithFilters(country, city, withFilters = true) {
  const params = new URLSearchParams();
  
  if (country && country !== 'undefined') {
    params.append('country', country);
  }
  
  if (city && city !== 'undefined') {
    params.append('city', city);
  }
  
  params.append('filters', withFilters.toString());
  
  if (!params.has('country') && !params.has('city')) {
    return [];
  }
  
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
