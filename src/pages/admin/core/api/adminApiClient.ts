import { supabase } from '@supabaseClient';

export async function invokeAdminApi<T = unknown>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {
    const { data, error } = await supabase.functions.invoke(endpoint, { body });
    if (error || data?.error) throw new Error(error?.message || data?.error);
    return (data?.data !== undefined ? data.data : data) as T;
}
