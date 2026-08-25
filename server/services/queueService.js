import { supabase } from "../utils/supabase.js";
import { logger } from "../utils/logger.js";

export const queueService = {
    save: async (data) => {
        try {
            if (data.status === 'running' && !data.jobId) {
                const { data: inserted, error } = await supabase.from('parser_jobs').insert({
                    city_name: data.cityName || 'Unknown',
                    status: 'running',
                    progress: data.progress || 0,
                    config: data,
                    started_at: new Date().toISOString(),
                    error_message: data.error || null
                }).select('id').single();
                if (error) throw error;
                if (inserted) data.jobId = inserted.id;
            } else {
                let jobId = data.jobId;
                if (!jobId) {
                    const { data: latest } = await supabase.from('parser_jobs')
                        .select('id').in('status', ['pending', 'running']).eq('city_name', data.cityName).order('created_at', { ascending: false }).limit(1).maybeSingle();
                    if (latest) jobId = latest.id;
                }
                
                if (jobId) {
                    const updateData = {
                        status: data.status,
                        progress: data.progress,
                        config: data,
                        completed_at: ['completed', 'failed'].includes(data.status) ? new Date().toISOString() : null,
                        error_message: data.error || null
                    };
                    if (data.results !== undefined) updateData.results = data.results;

                    await supabase.from('parser_jobs').update(updateData).eq('id', jobId);
                } else {
                    const insertData = {
                        city_name: data.cityName || 'Unknown',
                        status: data.status,
                        config: data,
                        error_message: data.error || null
                    };
                    if (data.results !== undefined) insertData.results = data.results;

                    await supabase.from('parser_jobs').insert(insertData);
                }
            }
        } catch (e) {
            console.error(`[QUEUE SAVE] ${e.message}`);
        }
    },

    // Додаємо лог до поточної активної задачі
    addLog: async (logEntry) => {
        try {
            // Отримуємо поточну активну задачу
            const { data, error } = await supabase
                .from('parser_jobs')
                .select('id, logs')
                .in('status', ['running', 'pending'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                const logs = data.logs || [];
                logs.push(logEntry);
                await supabase.from('parser_jobs').update({ logs }).eq('id', data.id);
            }
        } catch (e) {
            console.error(`[QUEUE LOG] ${e.message}`);
        }
    },

    // Отримуємо останню незавершену задачу (яка running або pending)
    get: async () => {
        try {
            const { data, error } = await supabase
                .from('parser_jobs')
                .select('*')
                .in('status', ['running', 'pending'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (error) throw error;
            return data || null;
        } catch (e) {
            console.error(`[QUEUE GET] ${e.message}`);
            return null;
        }
    },

    // Очищаємо всі поточні задачі (позначаємо як скасовані/завершені)
    clear: async () => {
        try {
            await supabase
                .from('parser_jobs')
                .update({ status: 'failed', error_message: 'Cleared by system' })
                .in('status', ['running', 'pending']);
        } catch (e) {
            console.error(`[QUEUE CLEAR] ${e.message}`);
        }
    },

    isLocked: async () => {
        const q = await queueService.get();
        return !!q;
    }
};