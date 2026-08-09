import { supabase } from '@supabaseClient';

export interface DistrictComment {
  id: string;
  district_id: string;
  user_id: string;
  content: string;
  rating: number;
  is_hidden: boolean;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
}

export const fetchComments = async (districtId: string): Promise<DistrictComment[]> => {
  const { data, error } = await supabase
    .rpc('get_district_comments_with_users', { p_district_id: districtId });
  
  if (error) throw new Error(error.message);
  return data || [];
};

export const addComment = async (districtId: string, content: string, rating: number): Promise<DistrictComment> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Необхідна авторизація');

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
  const { data, error } = await supabase
    .from('district_comments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const hideComment = async (id: string, isHidden: boolean): Promise<void> => {
  const { error } = await supabase
    .from('district_comments')
    .update({ is_hidden: isHidden })
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const deleteComment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('district_comments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};
