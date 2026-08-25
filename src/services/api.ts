/* eslint-disable @typescript-eslint/ban-ts-comment */

import { supabase } from '../supabaseClient';

const LOCAL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const requestLocal = async (endpoint: string, method: string = 'GET', body: any = null, isText: boolean = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const options = { 
        method, 
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache',
            'Pragma': 'no-cache',
            'ngrok-skip-browser-warning': 'true',
            ...(token && { 'Authorization': `Bearer ${token}` })
        } 
    };
    if (body) options.body = JSON.stringify(body);
    
    const url = method === 'GET' ? `${LOCAL_API_URL}${endpoint}?t=${Date.now()}` : `${LOCAL_API_URL}${endpoint}`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }
    return isText ? await response.text() : await response.json();
};

const dbRes = async (promise: PromiseLike<any>) => {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
};

const edgeRes = async (functionName: string, payload: any = {}) => {
    const { data, error } = await supabase.functions.invoke(functionName, { 
        body: payload 
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
};

export const api = {
    auth: {
        getUser: async () => await supabase.auth.getUser(),
        getSession: async () => await supabase.auth.getSession(),
        signIn: async (credentials: any) => await supabase.auth.signInWithPassword(credentials),
        signOut: async () => await supabase.auth.signOut(),
        getAdminProfile: async (userId: string) => {
            const { data, error } = await supabase.from('admin_profiles').select('role, assigned_cities, allowed_tabs').eq('user_id', userId).single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        mfa: {
            listFactors: async () => await supabase.auth.mfa.listFactors(),
            unenroll: async (params: any) => await supabase.auth.mfa.unenroll(params),
            enroll: async (params: any) => await supabase.auth.mfa.enroll(params),
            challenge: async (params: any) => await supabase.auth.mfa.challenge(params),
            verify: async (params: any) => await supabase.auth.mfa.verify(params)
        },
        insertAuthLog: () => edgeRes('admin-logs-manage', { action: 'insert_auth_log' })
    },
    geo: {
        getStats: () => edgeRes('admin-dashboard-stats', { method: 'POST' }),
        getCountries: () => dbRes(supabase.from('countries').select('*').order('name')),
        getCities: (countryId: string) => dbRes(supabase.from('cities').select('*').eq('country_id', countryId).order('name')),
        getAllCities: () => dbRes(supabase.from('cities').select('id, name').order('name')),
        getDistricts: (cityId: string) => dbRes(supabase.from('districts').select('*, district_filter_data(last_updated)').eq('city_id', cityId).order('name')),
        getDistrictData: (districtId: string) => edgeRes('admin-district-manage', { action: 'get', districtId }),
        getCityMapData: (cityId: string) => edgeRes('admin-map-data', { cityId }),
        createCountry: (name: string) => edgeRes('admin-geo-manage', { action: 'create_country', payload: { name } }),
        createCity: (name: string, countryId: string) => edgeRes('admin-geo-manage', { action: 'create_city', payload: { name, countryId } }),
        createDistrict: (name: string, cityId: string) => edgeRes('admin-geo-manage', { action: 'create_districts', payload: { cityId, names: [name] } }),
        deleteCountry: (id: string) => edgeRes('admin-geo-manage', { action: 'delete_country', payload: { id } }),
        deleteCity: (id: string) => edgeRes('admin-geo-manage', { action: 'delete_city', payload: { id } }),
        deleteDistrict: (districtId: string) => edgeRes('admin-geo-manage', { action: 'delete_district', payload: { districtId } }),
        saveParsedResults: (resultsArray: any[]) => requestLocal('/geo/db/save-results', 'POST', { resultsArray }),
        saveDistrictData: (payload: any) => edgeRes('admin-geo-manage', { action: 'save_results', payload: { resultsArray: [payload] } }),
        updateDistrictStatus: (id: string, is_available: boolean) => dbRes(supabase.from('districts').update({ is_available }).eq('id', id)),
        getDistrictPhoto: async (districtId: string) => {
            const data = await dbRes(supabase.from('district_photos').select('photo_url').eq('district_id', districtId).limit(1).maybeSingle());
            return data?.photo_url || null;
        },
        saveDistrictPhoto: (districtId: string, photoUrl: string) => dbRes(supabase.from('district_photos').upsert({ district_id: districtId, photo_url: photoUrl, is_main: true }, { onConflict: 'district_id' }))
    },
    parser: {
        findDistrictsOSM: (cityName: string) => requestLocal('/geo/find-districts', 'POST', { cityName }),
        runOfflineParser: (config: any) => requestLocal('/geo/run-osm-parser', 'POST', config),
        getStatus: () => requestLocal('/geo/status'),
        getCurrentLog: () => requestLocal('/geo/current-log', 'GET', null, true),
        getPbfFiles: () => requestLocal('/geo/pbf-files'),
        getPendingResults: () => requestLocal('/geo/pending-results'),
        deletePendingResults: () => requestLocal('/geo/pending-results', 'DELETE'),
        updatePending: (newData: any) => requestLocal('/geo/update-pending', 'POST', { newData })
    },
    feedback: {
        getMessages: () => dbRes(supabase.from('contacts_messages').select('*').order('created_at', { ascending: false })),
        updateStatus: (id: string, status: string) => edgeRes('admin-feedback-manage', { action: 'change_status', id, newStatus: status }),
        deleteMessage: (id: string) => edgeRes('admin-feedback-manage', { action: 'delete_message', id }),
        deleteImage: async (fileName: string) => {
            const { error } = await supabase.storage.from('feedback_images').remove([fileName]);
            if (error) throw error;
        }
    },
    audit: {
        getLogs: (limit: number = 100) => dbRes(supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit))
    },
    aiLogs: {
        getLogs: (limit: number = 50) => dbRes(supabase.from('ai_system_logs').select('*').order('created_at', { ascending: false }).limit(limit)),
        insertSystemLog: (userId: string, userEmail: string, action: string) => dbRes(supabase.from('ai_system_logs').insert({ user_id: userId, user_email: userEmail, log_type: 'system', system_action: action }))
    },
    notifications: {
        getAll: () => edgeRes('admin-notifications-manage', { action: 'get_all' }),
        create: (payload: any) => edgeRes('admin-notifications-manage', { action: 'create', payload }),
        updateStatus: (id: string, isActive: boolean) => edgeRes('admin-notifications-manage', { action: 'update_status', payload: { id, is_active: isActive } }),
        delete: (id: string) => edgeRes('admin-notifications-manage', { action: 'delete', payload: { id } })
    },
    storage: {
        uploadDistrictPhoto: async (fileName: string, file: any) => {
            const { error } = await supabase.storage.from('district-photos').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from('district-photos').getPublicUrl(fileName);
            return data.publicUrl;
        }
    },
    config: {
        getFields: () => dbRes(supabase.from('fields_config').select('*').order('sort_order')),
        getGroups: () => dbRes(supabase.from('field_groups').select('*').order('sort_order')),
        createField: (payload: any) => dbRes(supabase.from('fields_config').insert([payload]).select().single()),
        updateField: (id: string, payload: any) => dbRes(supabase.from('fields_config').update(payload).eq('id', id).select().single()),
        deleteField: (id: string) => dbRes(supabase.from('fields_config').delete().eq('id', id))
    },
    translations: {
        getAll: async () => {
            let allData = [];
            let from = 0;
            const limit = 1000;
            let hasMore = true;

            // Витягуємо дані партіями по 1000 штук
            while (hasMore) {
                const { data, error } = await supabase
                    .from('translations')
                    .select('*')
                    .order('translation_key')
                    .range(from, from + limit - 1);

                if (error) throw new Error(error.message);

                allData = [...allData, ...data];

                // Якщо прийшло менше 1000, значить ми забрали все
                if (data.length < limit) {
                    hasMore = false;
                } else {
                    from += limit;
                }
            }
            return allData;
        },
        save: (payload: any) => dbRes(supabase.from('translations').upsert(payload, { onConflict: 'translation_key' })),
        delete: (key: string) => dbRes(supabase.from('translations').delete().eq('translation_key', key))
    },
    scraperRules: {
        getAll: () => dbRes(supabase.from('scraper_rules').select('*').order('country_code')),
        save: (payload: any) => dbRes(supabase.from('scraper_rules').upsert(payload).select().single()),
        delete: (id: string) => dbRes(supabase.from('scraper_rules').delete().eq('id', id))
    }
};
