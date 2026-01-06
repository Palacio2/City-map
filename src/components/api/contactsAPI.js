const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-contact-form`;

export const contactsAPI = {
  submitMessage: async (formData) => {
    try {
      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Помилка: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Contacts API Error:', error);
      throw error; // Прокидаємо помилку далі в компонент
    }
  },
};