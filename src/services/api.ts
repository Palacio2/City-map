

import { supabase } from '../supabaseClient';
import type { SignInWithPasswordCredentials } from '@supabase/supabase-js';

const LOCAL_API_URL = import.meta.env.VITE_API_URL || '';

export const requestLocal = async (endpoint: string, method: string = 'GET', body: Record<string, unknown> | null = null, isText: boolean = false, signal?: AbortSignal) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const options: RequestInit = {
        method,
        signal,
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    if (body) options.body = JSON.stringify(body);

    const url = `${LOCAL_API_URL}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
    }
    return isText ? await response.text() : await response.json();
};

export const edgeRes = async (functionName: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return (data?.data !== undefined ? data.data : data);
};

export const api = {
    auth: {
        getUser: async () => await supabase.auth.getUser(),
        getSession: async () => await supabase.auth.getSession(),
        signIn: async (credentials: SignInWithPasswordCredentials) => await supabase.auth.signInWithPassword(credentials),
        signOut: async () => await supabase.auth.signOut(),
        getAdminProfile: async (userId: string) => {
            const { data, error } = await supabase.from('admin_profiles').select('role, assigned_cities, allowed_tabs').eq('user_id', userId).single();
            if (error && error.code !== 'PGRST116') throw error;
            return data;
        },
        mfa: {
            listFactors: async () => await supabase.auth.mfa.listFactors(),
            unenroll: async (params: { factorId: string }) => await supabase.auth.mfa.unenroll(params),
            enroll: async (params: { factorType: 'totp' }) => await supabase.auth.mfa.enroll(params),
            challenge: async (params: { factorId: string }) => await supabase.auth.mfa.challenge(params),
            verify: async (params: { factorId: string; challengeId: string; code: string }) => await supabase.auth.mfa.verify(params)
        },
        insertAuthLog: () => edgeRes('admin-logs-manage', { action: 'insert_auth_log' })
    },
};
