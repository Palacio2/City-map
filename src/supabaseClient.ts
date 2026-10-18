import { createClient } from '@supabase/supabase-js';
import { env } from '@config/env';
import type { Database } from '@shared/types/database.types';

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
export const auth = supabase.auth;
