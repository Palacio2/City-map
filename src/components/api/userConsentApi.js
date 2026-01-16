import { supabase } from '../../supabaseClient';

export const userConsentApi = {
  async checkConsentStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('is_terms_accepted')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return false;
      }

      if (!data) {
        await supabase.from('user_stats').insert({ user_id: userId });
        return false;
      }

      return !!data.is_terms_accepted;
    } catch (e) {
      return false;
    }
  },

  async acceptConsent(userId) {
    return await supabase
      .from('user_stats')
      .upsert({ 
        user_id: userId,
        is_terms_accepted: true, 
        terms_accepted_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};