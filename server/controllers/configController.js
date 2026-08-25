import { supabase } from "../utils/supabase.js";
import { z } from 'zod';

const FieldPayloadSchema = z.object({
    field_code: z.string().min(2).regex(/^[a-z0-9_]+$/),
    admin_label: z.string().min(1),
    icon: z.string().min(1),
    data_type: z.enum(['integer', 'numeric', 'boolean', 'text']),
    ui_group: z.string().min(1),
    source_type: z.enum(['osm', 'scraper', 'api', 'gus', 'manual']),
    ui_component: z.enum(['input_number', 'input_text', 'select', 'textarea']),
    parser_config: z.union([z.string(), z.record(z.unknown()), z.null()]).optional(),
    is_visible_table: z.boolean().optional().default(false),
    is_visible_form: z.boolean().optional().default(false),
    sort_order: z.number().int().optional().default(0),
    is_active: z.boolean().optional().default(true),
}).strict();

const normalizeParserConfig = (payload) => {
    if (typeof payload.parser_config === 'string') {
        try {
            payload.parser_config = JSON.parse(payload.parser_config);
        } catch {
            payload.parser_config = {};
        }
    }
    return payload;
};

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
        const parsed = FieldPayloadSchema.parse(req.body);
        const payload = normalizeParserConfig({ ...parsed });

        const { data, error } = await supabase.from('fields_config').insert([payload]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
        res.status(500).json({ error: err.message });
    }
};

export const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const parsed = FieldPayloadSchema.partial().parse(req.body);
        const payload = normalizeParserConfig({ ...parsed });

        const { data, error } = await supabase.from('fields_config').update(payload).eq('id', id).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
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