import { normalizeAdminProfile, requireAction, requireSuperAdmin, requireVerifiedMfa } from '../../shared/authorization.js';

export const createRequireAuth = (supabase) => async (req, res, next) => {
    const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
    if (!match) return res.status(401).json({ error: 'Bearer token required' });
    try {
        const { data: { user }, error } = await supabase.auth.getUser(match[1]);
        if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });
        requireVerifiedMfa(match[1]);
        const { data: profile, error: profileError } = await supabase.from('admin_profiles')
            .select('role, allowed_tabs, assigned_cities').eq('user_id', user.id).maybeSingle();
        if (profileError) throw profileError;
        const access = normalizeAdminProfile(profile);
        req.user = user;
        req.adminAccess = access;
        req.adminRole = access.role;
        req.allowedTabs = access.allowedTabs;
        req.assignedCities = access.assignedCities;
        return next();
    } catch (error) {
        return res.status(error.status === 403 ? 403 : 503).json({ error: 'Unable to authorize request' });
    }
};

const guard = (check) => (req, res, next) => {
    try { check(req.adminAccess); return next(); }
    catch { return res.status(403).json({ error: 'Forbidden' }); }
};
export const requireTab = (tab) => guard(access => requireAction(access, tab));
export const requireSuperAdminAccess = guard(requireSuperAdmin);
