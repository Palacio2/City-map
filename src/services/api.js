import { supabase } from '../supabaseClient';

const LOCAL_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const requestLocal = async (endpoint, method = 'GET', body = null, isText = false) => {
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

export const api = {
    auth: {
        getUser: async () => await supabase.auth.getUser(),
        getSession: async () => await supabase.auth.getSession(),
        signIn: async (credentials) => await supabase.auth.signInWithPassword(credentials),
        signOut: async () => await supabase.auth.signOut(),
        getAdminProfile: async (userId) => {
            const { data, error } = await supabase.from('admin_profiles').select('role, assigned_cities').eq('user_id', userId).single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        mfa: {
            listFactors: async () => await supabase.auth.mfa.listFactors(),
            unenroll: async (params) => await supabase.auth.mfa.unenroll(params),
            enroll: async (params) => await supabase.auth.mfa.enroll(params),
            challenge: async (params) => await supabase.auth.mfa.challenge(params),
            verify: async (params) => await supabase.auth.mfa.verify(params)
        }
    },
    geo: {
        getStats: () => requestLocal('/geo/db/stats'),
        getCountries: () => requestLocal('/geo/db/countries'),
        getCities: (countryId) => requestLocal(`/geo/db/cities/${countryId}`),
        getAllCities: async () => {
            const { data, error } = await supabase.from('cities').select('id, name').order('name');
            if (error) throw new Error(error.message);
            return data || [];
        },
        getDistricts: (cityId) => requestLocal(`/geo/db/districts/${cityId}`),
        getDistrictData: (districtId) => requestLocal(`/geo/db/district-data/${districtId}`),
        getCityMapData: (cityId) => requestLocal(`/geo/db/cities/${cityId}/map`),
        createCountry: (name) => requestLocal('/geo/db/countries', 'POST', { name }),
        createCity: (name, countryId) => requestLocal('/geo/db/cities', 'POST', { name, countryId }),
        createDistrict: (name, cityId) => requestLocal('/geo/db/districts', 'POST', { name, cityId }),
        deleteCountry: (id) => requestLocal(`/geo/db/countries/${id}`, 'DELETE'),
        deleteCity: (id) => requestLocal(`/geo/db/cities/${id}`, 'DELETE'),
        deleteDistrict: (id) => requestLocal(`/geo/db/districts/${id}`, 'DELETE'),
        saveParsedResults: (resultsArray) => requestLocal('/geo/db/save-results', 'POST', { resultsArray }),
        saveDistrictData: (payload) => requestLocal('/geo/db/save-results', 'POST', { resultsArray: [payload] }),
        updateDistrictStatus: (id, is_available) => requestLocal(`/geo/db/districts/${id}/status`, 'PATCH', { is_available }),
        getDistrictPhoto: async (districtId) => {
            const { data } = await supabase.from('district_photos').select('photo_url').eq('district_id', districtId).limit(1).maybeSingle();
            return data ? data.photo_url : null;
        },
        saveDistrictPhoto: async (districtId, photoUrl) => {
            const { error } = await supabase.from('district_photos').upsert({ district_id: districtId, photo_url: photoUrl, is_main: true }, { onConflict: 'district_id' });
            if (error) throw error;
        }
    },
    parser: {
        findDistrictsOSM: (cityName) => requestLocal('/geo/find-districts', 'POST', { cityName }),
        runOfflineParser: (config) => requestLocal('/geo/run-osm-parser', 'POST', config),
        getStatus: () => requestLocal('/geo/status'),
        getCurrentLog: () => requestLocal('/geo/current-log', 'GET', null, true),
        getPbfFiles: () => requestLocal('/geo/pbf-files'),
        getPendingResults: () => requestLocal('/geo/pending-results'),
        deletePendingResults: () => requestLocal('/geo/pending-results', 'DELETE'),
        updatePending: (newData) => requestLocal('/geo/update-pending', 'POST', { newData }),
        singleOtodom: (url) => requestLocal('/geo/single-otodom', 'POST', { url }),
        singleGus: (cityName) => requestLocal('/geo/single-gus', 'POST', { cityName }),
        singleWaqi: (lat, lon) => requestLocal('/geo/single-waqi', 'POST', { lat, lon }),
        singleOsm: (cityName, districtName, pbfFile, metrics) => requestLocal('/geo/single-osm', 'POST', { cityName, districtName, pbfFile, metrics })
    },
    feedback: {
        getMessages: async () => {
            const { data, error } = await supabase.from('contacts_messages').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        updateStatus: async (id, status) => {
            const { error } = await supabase.from('contacts_messages').update({ status }).eq('id', id);
            if (error) throw error;
        },
        deleteMessage: async (id) => {
            const { error } = await supabase.from('contacts_messages').delete().eq('id', id);
            if (error) throw error;
        },
        deleteImage: async (fileName) => {
            const { error } = await supabase.storage.from('feedback_images').remove([fileName]);
            if (error) throw error;
        }
    },
    audit: {
        getLogs: async (limit = 100) => {
            const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
            if (error) throw error;
            return data || [];
        }
    },
    aiLogs: {
        getLogs: async (limit = 50) => {
            const { data, error } = await supabase.from('ai_system_logs').select('*').order('created_at', { ascending: false }).limit(limit);
            if (error) throw error;
            return data || [];
        },
        insertSystemLog: async (userId, userEmail, action) => {
            const { error } = await supabase.from('ai_system_logs').insert({
                user_id: userId,
                user_email: userEmail,
                log_type: 'system',
                system_action: action
            });
            if (error) throw error;
        }
    },
    notifications: {
        getAll: async () => {
            const { data, error } = await supabase.from('global_notifications').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        create: async (payload) => {
            const { error } = await supabase.from('global_notifications').insert(payload);
            if (error) throw error;
        },
        updateStatus: async (id, isActive) => {
            const { error } = await supabase.from('global_notifications').update({ is_active: isActive }).eq('id', id);
            if (error) throw error;
        },
        delete: async (id) => {
            const { error } = await supabase.from('global_notifications').delete().eq('id', id);
            if (error) throw error;
        }
    },
    storage: {
        uploadDistrictPhoto: async (fileName, file) => {
            const { error } = await supabase.storage.from('district-photos').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from('district-photos').getPublicUrl(fileName);
            return data.publicUrl;
        }
    },
    config: {
        getFields: () => requestLocal('/geo/config/fields'),
        getGroups: () => requestLocal('/geo/config/groups'),
        createField: (payload) => requestLocal('/geo/config/fields', 'POST', payload),
        updateField: (id, payload) => requestLocal(`/geo/config/fields/${id}`, 'PUT', payload),
        deleteField: (id) => requestLocal(`/geo/config/fields/${id}`, 'DELETE')
    },
    translations: {
        getAll: () => requestLocal('/geo/config/translations'),
        save: (payload) => requestLocal('/geo/config/translations', 'POST', payload),
        // Оскільки ключ може містити крапки (fields.schools), передаємо його обережно:
        delete: (key) => requestLocal(`/geo/config/translations/${encodeURIComponent(key)}`, 'DELETE')
    },
    scraperRules: {
        getAll: () => requestLocal('/geo/config/scraper-rules'),
        save: (payload) => requestLocal('/geo/config/scraper-rules', 'POST', payload),
        delete: (id) => requestLocal(`/geo/config/scraper-rules/${id}`, 'DELETE')
    },

};