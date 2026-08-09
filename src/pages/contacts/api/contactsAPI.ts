import { supabase } from '@supabaseClient';

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
  consent_accepted: boolean;
}

export interface FeedbackPayload {
  email?: string;
  message: string;
  type: string;
  user_id?: string;
  page_url: string;
  screenshot_url?: string | null;
  screen_size: string;
  browser_info: string;
}

export const contactsAPI = {
  submitMessage: async (payload: ContactMessagePayload): Promise<void> => {
    const { error } = await supabase.from('contacts_messages').insert([payload]);
    if (error) throw new Error(error.message);
  },
  submitFeedback: async (payload: FeedbackPayload): Promise<void> => {
    const { error } = await supabase.from('contacts_messages').insert([{
      ...payload,
      email: payload.email || 'anonymous@citymaps.com', // required field
    }]);
    if (error) throw new Error(error.message);
  }
};
