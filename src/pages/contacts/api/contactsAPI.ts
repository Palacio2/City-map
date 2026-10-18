import { edgeRes } from '@services/api';

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
  consent_accepted: boolean;
  captcha_token: string;
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
    await edgeRes('submit-contact-form', { ...payload, type: 'contact' });
  },
  submitFeedback: async (payload: FeedbackPayload): Promise<void> => {
    await edgeRes('submit-contact-form', {
      ...payload,
      email: payload.email || 'anonymous@kvartals.com',
    });
  }
};
