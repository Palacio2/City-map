import { supabase } from '@supabaseClient';

export const userConsentApi = {
  async checkConsentStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_stats')
        .select('is_terms_accepted')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        const { error: insertError } = await supabase.from('user_stats').insert({ user_id: user.id });
        if (insertError) throw new Error(insertError.message);
        return false;
      }

      return !!data.is_terms_accepted;
    } catch (e) {
      console.error('Error checking consent status:', e.message);
      return false;
    }
  },

  async acceptConsent() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_stats')
        .upsert({ 
          user_id: user.id,
          is_terms_accepted: true, 
          terms_accepted_at: new Date().toISOString() 
        }, { onConflict: 'user_id' })
        .select();

      if (error) throw new Error(error.message);
      return { success: true, data };
    } catch (error) {
      console.error('Error accepting consent:', error.message);
      return { success: false, error: error.message };
    }
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};