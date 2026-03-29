import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tokenCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000;

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const cachedSession = tokenCache.get(token);
    if (cachedSession && cachedSession.exp > Date.now()) {
        req.user = cachedSession.user;
        return next();
    }

    let retries = 3;
    while (retries > 0) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            const role = user.app_metadata?.role;
            const hasAccess = role === 'admin' || role === 'super_admin';

            if (!hasAccess) {
                return res.status(403).json({ error: 'Access Denied: You do not have enough permissions.' });
            }

            tokenCache.set(token, { user, exp: Date.now() + CACHE_DURATION_MS });

            req.user = user;
            return next(); 

        } catch (err) {
            retries--;
            const errMsg = err?.message || '';
            const errCode = err?.code || '';
            
            if (errMsg.includes('fetch failed') || errCode === 'ECONNRESET' || errCode.includes('TIMEOUT')) {
                if (retries === 0) {
                    return res.status(503).json({ error: 'Supabase connection timeout. Try again later.' });
                }
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                return res.status(403).json({ error: errMsg });
            }
        }
    }
};