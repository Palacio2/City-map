import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getFields = async (req, res) => {
    try {
        const { data, error } = await supabase.from('fields_config').select('*').order('sort_order');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createField = async (req, res) => {
    try {
        const payload = { ...req.body };
        
        if (typeof payload.parser_config === 'string') {
            try { 
                payload.parser_config = JSON.parse(payload.parser_config); 
            } catch (e) { 
                payload.parser_config = {}; 
            }
        }

        const { data, error } = await supabase.from('fields_config').insert([payload]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = { ...req.body };
        
        if (typeof payload.parser_config === 'string') {
            try { 
                payload.parser_config = JSON.parse(payload.parser_config); 
            } catch (e) { 
                payload.parser_config = {}; 
            }
        }

        const { data, error } = await supabase.from('fields_config').update(payload).eq('id', id).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteField = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('fields_config').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getGroups = async (req, res) => {
    try {
        const { data, error } = await supabase.from('field_groups').select('*').order('sort_order');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};