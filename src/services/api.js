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
    geo: {
        getStats: () => requestLocal('/geo/db/stats'),
        getCountries: () => requestLocal('/geo/db/countries'),
        getCities: (countryId) => requestLocal(`/geo/db/cities/${countryId}`),
        getDistricts: (cityId) => requestLocal(`/geo/db/districts/${cityId}`),
        getDistrictData: (districtId) => requestLocal(`/geo/db/district-data/${districtId}`),
        getCityMapData: (cityId) => requestLocal(`/geo/db/cities/${cityId}/map`),
        createCountry: (name) => requestLocal('/geo/db/countries', 'POST', { name }),
        createCity: (name, countryId) => requestLocal('/geo/db/cities', 'POST', { name, countryId }),
        createDistrict: (name, cityId) => requestLocal('/geo/db/districts', 'POST', { name, cityId }),
        deleteCity: (id) => requestLocal(`/geo/db/cities/${id}`, 'DELETE'),
        deleteDistrict: (id) => requestLocal(`/geo/db/districts/${id}`, 'DELETE'),
        saveParsedResults: (resultsArray) => requestLocal('/geo/db/save-results', 'POST', { resultsArray }),
        saveDistrictData: (payload) => requestLocal('/geo/db/save-results', 'POST', { resultsArray: [payload] }),
        updateDistrictStatus: (id, is_available) => requestLocal(`/geo/db/districts/${id}/status`, 'PATCH', { is_available })
    },
    parser: {
        findDistrictsOSM: (cityName) => requestLocal('/geo/find-districts', 'POST', { cityName }),
        runOfflineParser: (config) => requestLocal('/geo/run-osm-parser', 'POST', config),
        singleOtodom: (url) => requestLocal('/geo/single-otodom', 'POST', { url }),
        singleGus: (cityName) => requestLocal('/geo/single-gus', 'POST', { cityName }),
        singleWaqi: (lat, lon) => requestLocal('/geo/single-waqi', 'POST', { lat, lon }),
        singleOsm: (cityName, districtName, pbfFileName, metrics) => requestLocal('/geo/single-osm', 'POST', { cityName, districtName, pbfFileName, metrics }),
        getStatus: () => requestLocal('/geo/status'),
        getCurrentLog: () => requestLocal('/geo/current-log', 'GET', null, true),
        getPbfFiles: () => requestLocal('/geo/pbf-files'),
        getPendingResults: () => requestLocal('/geo/pending-results'),
        deletePendingResults: () => requestLocal('/geo/pending-results', 'DELETE'),
        updatePending: (newData) => requestLocal('/geo/update-pending', 'POST', { newData })
    }
};