// Runtime-neutral authorization shared by Edge Functions and the parser API.
export class AccessError extends Error {
  status = 403;
}

// Call ONLY after Auth has verified this exact access token (getUser).
// Decoding alone is not token authentication. user_metadata is never consulted.
export function requireVerifiedMfa(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.aal === 'aal2') return;
  } catch { /* Missing/malformed assurance claims fail closed. */ }
  throw new AccessError('Multi-factor authentication required');
}

export function normalizeAdminProfile(profile) {
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new AccessError('Forbidden: active admin profile required');
  }
  return {
    role: profile.role,
    isSuperAdmin: profile.role === 'super_admin',
    allowedTabs: Array.isArray(profile.allowed_tabs) ? profile.allowed_tabs.filter(x => typeof x === 'string') : [],
    assignedCities: Array.isArray(profile.assigned_cities) ? profile.assigned_cities.filter(x => typeof x === 'string') : [],
  };
}

export function requireAction(access, ...permissions) {
  if (!access || !['admin', 'super_admin'].includes(access.role)) throw new AccessError('Forbidden: admin required');
  if (access.role === 'super_admin') return;
  if (!permissions.some(permission => access.allowedTabs?.includes(permission))) {
    throw new AccessError('Forbidden: missing action permission');
  }
}

export function requireCity(access, cityId) {
  if (!access || !['admin', 'super_admin'].includes(access.role)) throw new AccessError('Forbidden: admin required');
  if (typeof cityId !== 'string' || !cityId || (access.role !== 'super_admin' && !access.assignedCities?.includes(cityId))) {
    throw new AccessError('Forbidden: city outside assigned scope');
  }
}

export function requireSuperAdmin(access) {
  if (access?.role !== 'super_admin') throw new AccessError('Forbidden: super admin required');
}

export async function authorizeDistrictBatch(access, rows, loadDistricts) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 1000) {
    throw new AccessError('Invalid district batch');
  }
  const ids = rows.map(row => {
    const id = row?.district_id ?? row?.id;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        || (row.district_id && row.id && row.district_id !== row.id)) {
      throw new AccessError('Invalid district identifier');
    }
    return id.toLowerCase();
  });
  const uniqueIds = [...new Set(ids)];
  const districts = await loadDistricts(uniqueIds);
  if (!Array.isArray(districts) || districts.length !== uniqueIds.length
      || uniqueIds.some(id => !districts.some(district => district.id === id))) {
    throw new AccessError('Unknown district in batch');
  }
  for (const district of districts) requireCity(access, district.city_id);
  return districts;
}
