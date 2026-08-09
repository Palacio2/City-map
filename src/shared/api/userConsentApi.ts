import { supabase } from '@supabaseClient';

export const userConsentApi = {
  checkConsentStatus: async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    const { data, error } = await supabase
      .from('user_stats')
      .select('is_terms_accepted')
      .eq('user_id', session.user.id)
      .maybeSingle();
      
    if (error) throw error;
    return data?.is_terms_accepted || false;
  },
  acceptConsent: async (): Promise<{ error: Error | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: new Error('Unauthorized') };
    
    const { error } = await supabase
      .from('user_stats')
      .upsert({ 
        user_id: session.user.id, 
        is_terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    return { error };
  }
};