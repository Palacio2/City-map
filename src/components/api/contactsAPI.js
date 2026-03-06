import { authenticatedApiRequest } from './apiClient';

export const contactsAPI = {
  submitMessage: async (formData) => {
    return authenticatedApiRequest('/submit-contact-form', {
      method: 'POST',
      body: JSON.stringify({ ...formData, type: 'contact' }),
    });
  },
  submitFeedback: async (formData) => {
    return authenticatedApiRequest('/submit-contact-form', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },
};