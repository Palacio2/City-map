import { supabase } from "../utils/supabase.js";
import { z } from 'zod';

const isValidRegex = (val) => {
    if (!val || val.trim() === '') return true;
    try { new RegExp(val); return true; } catch { return false; }
};

const ScraperRuleSchema = z.object({
    id: z.string().uuid().optional(),
    country_code: z.string().min(2).max(5).transform(v => v.toUpperCase()),
    platform: z.string().min(2),
    type: z.enum(['sale', 'rent']),
    item_selector: z.string().min(1),
    price_regex: z.string().refine(isValidRegex, { message: 'Invalid regex' }),
    sqm_regex: z.string().refine(isValidRegex, { message: 'Invalid regex' }).optional().default(''),
    min_price: z.coerce.number().min(0),
    max_price: z.coerce.number().min(1),
    min_sqm: z.coerce.number().min(0),
    max_sqm: z.coerce.number().min(1),
    is_active: z.boolean(),
});

export const getRules = async (req, res) => {
    try {
        const { data, error } = await supabase.from('scraper_rules').select('*').order('country_code');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveRule = async (req, res) => {
    try {
        const parsed = ScraperRuleSchema.parse(req.body);
        const { data, error } = await supabase.from('scraper_rules').upsert(parsed).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) {
        if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
        res.status(500).json({ error: e.message });
    }
};

export const deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Missing rule id' });
        const { error } = await supabase.from('scraper_rules').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};