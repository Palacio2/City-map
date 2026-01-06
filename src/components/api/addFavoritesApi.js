const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/add-favorites`;

const request = async (body, authToken) => {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

export const favoritesAPI = {
  checkFavorite: (districtId, authToken) => 
    request({ districtId, action: 'check' }, authToken),

  toggleFavorite: (districtId, authToken) => 
    request({ districtId, action: 'toggle' }, authToken),

  addFavorite: (districtId, authToken) => 
    favoritesAPI.toggleFavorite(districtId, authToken),

  removeFavorite: (districtId, authToken) => 
    favoritesAPI.toggleFavorite(districtId, authToken)
};