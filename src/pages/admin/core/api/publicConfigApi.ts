import { supabase } from '@supabaseClient';

const dbRes = async <T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>) => {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
};

export const publicConfigApi = {
    getFields: () => dbRes(supabase.from('fields_config').select('*').order('sort_order')),
    getGroups: () => dbRes(supabase.from('field_groups').select('*').order('sort_order')),
    
    getAllTranslations: async () => {
        let allData: Record<string, unknown>[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;
        while (hasMore) {
            const { data, error } = await supabase.from('translations').select('*').order('translation_key').range(from, from + limit - 1);
            if (error) throw new Error(error.message);
            allData = [...allData, ...(data as Record<string, unknown>[])];
            if (data.length < limit) hasMore = false;
            else from += limit;
        }
        return allData;
    }
};
