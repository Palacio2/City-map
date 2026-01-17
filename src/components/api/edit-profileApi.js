import { supabase } from '../../supabaseClient';

export const profileAPI = {
  getProfile: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error('User not authenticated.');

      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        created_at: user.created_at,
        email_confirmed: !!user.email_confirmed_at,
        new_email: user.email_change_sent_at ? user.email : null 
      };
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...profileData,
          updated_at: new Date().toISOString()
        }
      });
      if (error) throw error;
      
      return { success: true, message: 'Профіль успішно оновлено.' };
    } catch (error) {
      throw error;
    }
  },

  updateEmail: async (newEmail) => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      return {
        success: true,
        message: 'Лист для підтвердження відправлено на нову адресу.',
        needs_confirmation: true
      };
    } catch (error) {
      throw error;
    }
  },

  checkEmailConfirmation: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      return {
        isConfirmed: !!user.email_confirmed_at,
        newEmailPending: !!user.email_change_sent_at
      };
    } catch (error) {
      throw error;
    }
  },

  resendConfirmationEmail: async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'email_change',
        email: email
      });
      if (error) throw error;
      
      return { success: true, message: 'Лист для підтвердження відправлено повторно.' };
    } catch (error) {
      throw error;
    }
  }
};

export const handleApiError = (error) => {
  if (!error || !error.message) {
      return 'Сталася невідома помилка.';
  }

  if (error.message.includes('Invalid Refresh Token') || error.message.includes('JWT')) {
    return 'Помилка авторизації. Будь ласка, увійдіть знову.';
  } else if (error.message.includes('NetworkError')) {
    return 'Помилка мережі. Перевірте підключення до інтернету.';
  } else if (error.message.includes('User not found')) {
    return 'Користувача не знайдено. Будь ласка, увійдіть знову.';
  } else if (error.message.includes('already registered')) {
    return 'Цей email вже зареєстрований.';
  } else if (error.message.includes('email change')) {
    return 'Помилка при зміні email. Спробуйте іншу адресу.';
  } else {
    return error.message;
  }
};

export default profileAPI;
