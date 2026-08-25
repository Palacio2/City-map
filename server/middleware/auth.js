import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tokenCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000;
const CACHE_MAX_SIZE = 500;

// Periodic cleanup of expired tokens to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of tokenCache) {
        if (val.exp < now) tokenCache.delete(key);
    }
}, 10 * 60 * 1000).unref();

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const cachedSession = tokenCache.get(token);
    if (cachedSession && cachedSession.exp > Date.now()) {
        req.user = cachedSession.user;
        req.adminRole = cachedSession.role;
        req.allowedTabs = cachedSession.allowedTabs;
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

            const { data: profile } = await supabase.from('admin_profiles').select('allowed_tabs, role').eq('user_id', user.id).maybeSingle();

            const finalRole = profile?.role || role;
            const allowedTabs = profile?.allowed_tabs || [];

            // Evict oldest entries if cache is full
            if (tokenCache.size >= CACHE_MAX_SIZE) {
                const firstKey = tokenCache.keys().next().value;
                tokenCache.delete(firstKey);
            }
            tokenCache.set(token, { user, role: finalRole, allowedTabs, exp: Date.now() + CACHE_DURATION_MS });

            req.user = user;
            req.adminRole = finalRole;
            req.allowedTabs = allowedTabs;
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

export const requireTab = (tab) => {
    return (req, res, next) => {
        if (req.adminRole === 'super_admin') return next();
        if (req.allowedTabs && req.allowedTabs.includes(tab)) return next();
        return res.status(403).json({ error: `Forbidden: Missing tab permission '${tab}'` });
    };
};