import { authenticatedApiRequest } from './apiClient';

export const contactsAPI = {
  submitMessage: async (formData) => {
    return authenticatedApiRequest('/submit-contact-form', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },
};
