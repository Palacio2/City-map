import { supabase } from '@supabaseClient';
import type { LoginFormValues, RegisterFormValues } from '../validation';

export const loginUser = async (credentials: LoginFormValues) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });
  if (error) throw error;
  return data;
};

export const registerUser = async (data: RegisterFormValues) => {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.name.trim() },
      emailRedirectTo: `${globalThis.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
  return authData;
};

export const resetPassword = async (email: string) => {
  const redirectUrl = `${globalThis.location.origin}/profile/password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (error) throw error;
};

export const resendConfirmation = async (email: string) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${globalThis.location.origin}/auth/callback` }
  });
  if (error) throw error;
};

export const signInWithProvider = async (provider: 'google') => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${globalThis.location.origin}/auth/callback`,
      skipBrowserRedirect: false
    }
  });
  if (error) throw error;
};