import { supabase } from '@supabaseClient';

export const storageApi = {
  async getSignedUrl(bucket, path, expiresIn = 3600) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  },

  async uploadFile(bucket, path, file) {
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw new Error(error.message);
    return path;
  },

  async removeFile(bucket, path) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
    return true;
  },

  async downloadFile(bucket, path) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw new Error(error.message);
    return data;
  },

  async updateUserAvatar(avatarUrl) {
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl }
    });
    if (error) throw new Error(error.message);
    return true;
  },

  async getUserMetadata() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    return user?.user_metadata || {};
  }
};