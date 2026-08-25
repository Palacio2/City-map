import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
    VITE_SUPABASE_URL: z.string().url().optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
    SUPABASE_KEY: z.string().min(10).optional(),
    NODE_ENV: z.string().default('development')
}).refine(data => data.VITE_SUPABASE_URL || data.SUPABASE_URL, {
    message: "Missing Supabase URL",
    path: ["VITE_SUPABASE_URL"]
}).refine(data => data.SUPABASE_SERVICE_ROLE_KEY || data.SUPABASE_KEY, {
    message: "Missing Supabase Key",
    path: ["SUPABASE_SERVICE_ROLE_KEY"]
});

const env = EnvSchema.parse(process.env);

export const ENV = {
    SUPABASE_URL: env.VITE_SUPABASE_URL || env.SUPABASE_URL,
    SUPABASE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY,
    NODE_ENV: env.NODE_ENV
};
