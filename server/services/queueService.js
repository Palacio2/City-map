import { supabase } from '../utils/supabase.js';

const rpc = async (name, args) => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw error;
    return data;
};
export const queueService = {
    async acquire(config) {
        const job = await rpc('claim_parser_job', { p_config: config });
        if (!job) return false;
        config.jobId = job.id;
        config.leaseToken = job.lease_token;
        config.status = 'running';
        return true;
    },
    async save(config) {
        if (!config.jobId || !config.leaseToken) throw new Error('Parser lease required');
        await rpc('update_parser_job', { p_id: config.jobId, p_token: config.leaseToken, p_config: config });
    },
    async heartbeat(config) {
        await rpc('update_parser_job', { p_id: config.jobId, p_token: config.leaseToken, p_config: null });
    },
    async addLogsBatch(entries, jobId, token) {
        if (!jobId || !token) throw new Error('Log job lease required');
        await rpc('append_parser_logs', { p_id: jobId, p_token: token, p_entries: entries });
    },
    async get() {
        const { data, error } = await supabase.from('parser_jobs').select('*')
            .in('status', ['pending', 'running']).gt('lease_until', new Date().toISOString())
            .order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error) throw error;
        return data;
    },
    async isLocked() { return !!(await queueService.get()); },
};
