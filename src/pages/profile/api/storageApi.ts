import { supabase } from '@supabaseClient';

export const getSignedAvatarUrl = async (path: string, expiresIn: number = 3600): Promise<string> => {
  if (/^https:\/\//i.test(path)) {
    const url = new URL(path);
    if (url.username || url.password) throw new Error('Invalid avatar URL');
    return url.href;
  }
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};

export const uploadAvatarFile = async (path: string, file: File): Promise<string> => {
  const { error } = await supabase.storage.from('avatars').upload(path, file);
  if (error) throw new Error(error.message);
  return path;
};

export const removeAvatarFile = async (path: string): Promise<boolean> => {
  const { error } = await supabase.storage.from('avatars').remove([path]);
  if (error) throw new Error(error.message);
  return true;
};

export const updateUserAvatarUrl = async (avatarUrl: string): Promise<boolean> => {
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl }
  });
  if (error) throw new Error(error.message);
  return true;
};
