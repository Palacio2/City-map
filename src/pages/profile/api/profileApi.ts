import { supabase } from '@supabaseClient';
import type { UserProfile, ProfileEditPayload } from '../types';

export const getProfile = async (): Promise<UserProfile> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User not found');

  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || '',
    email: user.email || '',
    phone: user.user_metadata?.phone || '',
    avatar_url: user.user_metadata?.avatar_url || ''
  };
};

export const updateProfile = async (payload: ProfileEditPayload): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    data: { full_name: payload.full_name, phone: payload.phone }
  });
  if (error) throw error;
};

export const updateEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
};

export const updatePassword = async (password: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};