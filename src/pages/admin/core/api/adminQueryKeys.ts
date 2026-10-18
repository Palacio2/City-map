export const adminQueryKeys = {
    // Geo
    countries: ['admin', 'countries'] as const,
    cities: (countryId?: string) => countryId ? ['admin', 'cities', countryId] as const : ['admin', 'cities'] as const,
    districts: (cityId?: string) => cityId ? ['admin', 'districts', cityId] as const : ['admin', 'districts'] as const,
    districtDetails: (id: string) => ['admin', 'district', id] as const,
    
    // Parser
    parsedDistricts: ['admin', 'parsedDistricts'] as const,
    scraperRules: ['admin', 'scraperRules'] as const,
    
    // Config & Translations
    translations: ['dbTranslations'] as const,
    publicConfigGroups: ['fieldGroups'] as const,
    publicConfigFields: ['fieldsConfig'] as const,

    // Storage
    storageFiles: (bucket: string, path: string) => ['admin', 'storage', bucket, path] as const,
    
    // Logs
    auditLogs: ['admin', 'auditLogs'] as const,
    aiLogs: ['admin', 'aiLogs'] as const,
    
    // Feedback
    feedbackMessages: ['feedbackMessages'] as const,
    
    // Users
    users: ['admin', 'users'] as const,
};
