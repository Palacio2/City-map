import { supabase } from '@supabaseClient';

export const profileAPI = {
  getProfile: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!user) throw new Error('User not authenticated');

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
      created_at: user.created_at,
      email_confirmed: !!user.email_confirmed_at,
      new_email: user.email_change_sent_at ? user.email : null 
    };
  },

  updateProfile: async (profileData) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        ...profileData,
        updated_at: new Date().toISOString()
      }
    });
    if (error) throw new Error(error.message);
    return { success: true };
  },

  updateEmail: async (newEmail) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw new Error(error.message);
    
    return {
      success: true,
      needs_confirmation: true
    };
  },

  checkEmailConfirmation: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    
    return {
      isConfirmed: !!user.email_confirmed_at,
      newEmailPending: !!user.email_change_sent_at
    };
  },

  resendConfirmationEmail: async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'email_change',
      email: email
    });
    if (error) throw new Error(error.message);
    
    return { success: true };
  }
};

export default profileAPI;