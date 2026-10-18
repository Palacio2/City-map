import { supabase } from '../utils/supabase.js';
import { createRequireAuth } from './adminAuthorization.js';
export { requireTab, requireSuperAdminAccess } from './adminAuthorization.js';
export const requireAuth = createRequireAuth(supabase);
