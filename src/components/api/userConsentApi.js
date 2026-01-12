import { supabase } from '../../supabaseClient';

export const userConsentApi = {
  /**
   * Перевіряє, чи погодився користувач з правилами
   * @param {string} userId 
   * @returns {Promise<boolean>} повертає true, якщо згода є
   */
  async checkConsentStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('is_terms_accepted')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.warn('Consent check warning:', error?.message || 'No stats found');
        return false;
      }

      return !!data.is_terms_accepted;
    } catch (e) {
      console.error('Consent check error:', e);
      return false;
    }
  },

  /**
   * Записує згоду користувача в базу
   * @param {string} userId 
   * @returns {Promise<{error: any}>}
   */
  async acceptConsent(userId) {
    return await supabase
      .from('user_stats')
      .update({ 
        is_terms_accepted: true, 
        terms_accepted_at: new Date().toISOString() 
      })
      .eq('user_id', userId);
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};