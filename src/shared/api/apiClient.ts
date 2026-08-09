import { supabase } from '@supabaseClient';
import { env } from '@config/env';

export const authenticatedApiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API Request Failed');
  return data;
};