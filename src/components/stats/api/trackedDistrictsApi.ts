// @ts-nocheck
import { supabase } from '@supabaseClient';
import i18n from '../../../i18n/i18n';
import { authenticatedApiRequest } from '@api/apiClient';
import type { TrackedDistrictPayload, TrackedDistrict } from '../types';

export const fetchTrackedDistrictsWithStats = async (): Promise<TrackedDistrict[]> => {
  return await authenticatedApiRequest<TrackedDistrict[]>('/get-tracked-districts');
};

export const addTrackedDistrict = async (payload: TrackedDistrictPayload): Promise<TrackedDistrict> => {
  const { data, error } = await supabase
    .from('user_tracked_districts')
    .insert([{
      country: payload.country,
      city: payload.city,
      district: payload.district,
      district_id: payload.districtId
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.code === '23505' ? i18n.t('stats.errors.already_added') : i18n.t('stats.errors.add_failed'));
  }
  return data;
};

export const removeTrackedDistrict = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_tracked_districts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(i18n.t('stats.errors.delete_error'));
  return true;
};
