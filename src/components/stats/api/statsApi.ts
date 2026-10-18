import type { Database } from '@shared/types/database.types';
import type { TrackedDistrict } from '../types';
import { supabase } from '@supabaseClient';
import type { TransformedDistrict } from '@utils/dataTransformers';

const activityLocation = ({ id, city, country }: TransformedDistrict) => ({ id, city, country });

async function recordActivity(action: string, write: () => PromiseLike<unknown>): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await write();
  } catch (err) { console.error(`Failed to ${action}:`, err); }
}

export const trackDistrictVisit = (district: TransformedDistrict): Promise<void> =>
  recordActivity('track visit', () => supabase.rpc('track_district_visit', { district_data: activityLocation(district) }));

export const registerComparisonEvent = (districts: TransformedDistrict[]): Promise<void> =>
  recordActivity('register comparison', () => supabase.rpc('register_comparison_event', { districts_payload: districts.map(activityLocation) }));

export interface DashboardData {
  stats: Database['public']['Tables']['user_stats']['Row'] | null;
  weeklyActivity: unknown[];
  popularDistricts: unknown[];
  trackedDistricts: TrackedDistrict[];
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');
  
  const userId = session.user.id;

  const [weeklyActivityRes, popularDistrictsRes, trackedDistrictsRes, userStatsRes] = await Promise.all([
    supabase.rpc('get_weekly_activity_stats', { uid: userId }),
    supabase.rpc('get_popular_districts_stats'),
    supabase.from('user_tracked_districts').select('*').eq('user_id', userId),
    supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
  ]);

  for (const result of [weeklyActivityRes, popularDistrictsRes, trackedDistrictsRes, userStatsRes]) {
    if (result.error) throw result.error;
  }

  return {
    stats: userStatsRes.data,
    weeklyActivity: weeklyActivityRes.data || [],
    popularDistricts: popularDistrictsRes.data || [],
    trackedDistricts: trackedDistrictsRes.data || []
  };
};

export const updateUserTime = async (timeSpentMs: number): Promise<void> => {
  if (!Number.isFinite(timeSpentMs) || timeSpentMs < 1000) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  // A delayed browser timer must still respect the server's bounded interval.
  const { error } = await supabase.rpc('update_user_time', {
    seconds: Math.min(600, Math.floor(timeSpentMs / 1000))
  });
  if (error) throw error;
};
