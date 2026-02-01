import { supabase } from '@supabaseClient'; 
import { authenticatedApiRequest } from './apiClient'; 

export async function fetchDashboardData() {
  return await authenticatedApiRequest('/get-dashboard-stats');
}

export async function updateUserTime(seconds) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return;
  }

  try {
    await authenticatedApiRequest('/update-user-time', { 
        method: 'POST',
        body: JSON.stringify({ seconds })
    });
  } catch (err) {
    console.error("Failed to update user time:", err);
  }
}

export async function trackActivity(type) {
  try {
    const { error } = await supabase.rpc('track_user_activity', { activity_type: type });
    if (error) throw error;
  } catch (err) {
    console.error("Failed to track activity:", err);
  }
}

export async function trackSearch() {
  await trackActivity('search');
}

export async function trackDistrictVisit(district) {
  if (!district || !district.id) return;

  const districtData = {
    id: district.id,
    name: district.name,
    city: district.city || district.cities?.name,
    country: district.country || district.cities?.countries?.name
  };

  try {
    const { error } = await supabase.rpc('track_district_visit', { 
      district_data: districtData 
    });
    
    if (error) throw error;
  } catch (err) {
    console.error("Failed to track visit:", err);
  }
}