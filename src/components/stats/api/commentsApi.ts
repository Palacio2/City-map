/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { supabase } from '@supabaseClient';
import i18n from '../../../i18n/i18n';

export interface DistrictComment {
  id: string;
  district_id: string;
  user_id: string;
  content: string;
  rating: number | null;
  is_hidden: boolean | null;
  created_at: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export const fetchComments = async (districtId: string): Promise<DistrictComment[]> => {
  const { data, error } = await supabase
    .rpc('get_district_comments_with_users', { p_district_id: districtId });
  
  if (error) throw new Error(error.message);
  
  // Always filter out hidden comments on the client side 
  // in case the RPC doesn't do it automatically
  return data ? data.filter((c: DistrictComment) => !c.is_hidden) : [];
};

export const addComment = async (districtId: string, content: string, rating: number): Promise<DistrictComment> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error(i18n.t('stats.errors.auth_required'));

  const { data, error } = await supabase
    .from('district_comments')
    .insert([{
      district_id: districtId,
      user_id: session.user.id,
      content,
      rating
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Admin only functions
export const fetchAllComments = async (): Promise<DistrictComment[]> => {
  const { data, error } = await supabase.functions.invoke('admin-comments-manage', {
    body: { action: 'getComments' }
  });

  if (error || data?.error) throw new Error(error?.message || data?.error);
  return data?.data || [];
};

export const hideComment = async (id: string, isHidden: boolean): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-comments-manage', {
    body: { action: 'hideComment', payload: { id, isHidden } }
  });

  if (error || data?.error) throw new Error(error?.message || data?.error);
};

export const deleteComment = async (id: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('admin-comments-manage', {
    body: { action: 'deleteComment', payload: { id } }
  });

  if (error || data?.error) throw new Error(error?.message || data?.error);
};
