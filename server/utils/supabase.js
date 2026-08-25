import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env.js";

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY);
