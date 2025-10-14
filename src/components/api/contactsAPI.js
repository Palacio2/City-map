// src/api/contactsAPI.js

// Беремо URL та ключ з змінних оточення
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/submit-contact-form`;

export const contactsAPI = {
  submitMessage: async (formData) => {
    try {
      console.log('Відправка даних до Edge Function:', formData);
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Успішна відповідь від Edge Function:', result);
      
      return { 
        success: true, 
        message: 'Повідомлення успішно відправлено.',
        data: result 
      };
    } catch (error) {
      console.error('API Error:', error);
      throw new Error(error.message || 'Помилка відправки форми.');
    }
  },
};