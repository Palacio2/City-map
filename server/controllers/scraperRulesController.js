import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const getRules = async (req, res) => {
    try {
        const { data, error } = await supabase.from('scraper_rules').select('*').order('country_code');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveRule = async (req, res) => {
    try {
        const ruleData = req.body;
        // Якщо id немає, Supabase згенерує його автоматично (insert)
        const { data, error } = await supabase.from('scraper_rules').upsert(ruleData).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteRule = async (req, res) => {
    try {
        const { error } = await supabase.from('scraper_rules').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};