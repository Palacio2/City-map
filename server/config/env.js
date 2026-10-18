import 'dotenv/config';
import { z } from 'zod';
import { resolveSupabaseKey } from '../../shared/supabaseKeys.js';

const EnvSchema = z.object({
    VITE_SUPABASE_URL: z.string().url().optional(),
    SUPABASE_URL: z.string().url().optional(),
    NODE_ENV: z.string().default('development')
}).refine(data => data.VITE_SUPABASE_URL || data.SUPABASE_URL, {
    message: "Missing Supabase URL",
    path: ["VITE_SUPABASE_URL"]
});

const env = EnvSchema.parse(process.env);

export const ENV = {
    SUPABASE_URL: env.VITE_SUPABASE_URL || env.SUPABASE_URL,
    SUPABASE_KEY: resolveSupabaseKey(name => name === 'SUPABASE_SERVICE_ROLE_KEY'
        ? process.env[name] ?? process.env.SUPABASE_KEY : process.env[name], 'secret'),
    NODE_ENV: env.NODE_ENV
};
