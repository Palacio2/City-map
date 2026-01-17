import { authenticatedApiRequest } from './apiClient';

async function apiRequest(endpoint) {
  return authenticatedApiRequest(endpoint);
}

export async function fetchDistrictsWithFilters(country, city) {
  const params = new URLSearchParams({ country, city, filters: 'true' });
  return apiRequest(`/get-districts?${params.toString()}`);
}
