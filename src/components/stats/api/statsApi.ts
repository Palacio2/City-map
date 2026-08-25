// @ts-nocheck
import { supabase } from '@supabaseClient';
import type { TransformedDistrict } from '@utils/dataTransformers';

export const trackDistrictVisit = async (district: TransformedDistrict): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await supabase.rpc('track_district_visit', {
      district_data: {
        id: district.id,
        city: (district as Record<string, unknown>).city,
        country: (district as Record<string, unknown>).country
      }
    });
  } catch (err) { console.error('Error caught in empty catch block:', err); }
};

export const fetchDashboardData = async (): Promise<any> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');
  
  const userId = session.user.id;

  const [weeklyActivityRes, popularDistrictsRes, trackedDistrictsRes, userStatsRes] = await Promise.all([
    supabase.rpc('get_weekly_activity_stats', { uid: userId }),
    supabase.rpc('get_popular_districts_stats'),
    supabase.from('user_tracked_districts').select('*').eq('user_id', userId),
    supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
  ]);

  if (weeklyActivityRes.error) console.error('weeklyActivity error:', weeklyActivityRes.error);
  if (popularDistrictsRes.error) console.error('popularDistricts error:', popularDistrictsRes.error);

  return {
    stats: userStatsRes.data,
    weeklyActivity: weeklyActivityRes.data || [],
    popularDistricts: popularDistrictsRes.data || [],
    trackedDistricts: trackedDistrictsRes.data || []
  };
};

export const updateUserTime = async (timeSpentMs: number): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await supabase.rpc('update_user_time', { 
      seconds: Math.floor(timeSpentMs / 1000) 
    });
  } catch (err) { console.error('Error caught in empty catch block:', err); }
};
