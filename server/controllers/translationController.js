import { supabase } from "../utils/supabase.js";
import { z } from 'zod';

const TranslationSchema = z.object({
    translation_key: z.string().min(1, 'translation_key is required'),
    uk: z.string().optional().default(''),
    pl: z.string().optional().default(''),
    en: z.string().optional().default(''),
});

export const getTranslations = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .limit(5000)
            .order('translation_key');

        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const stripHtml = (str) => typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '') : str;

export const saveTranslation = async (req, res) => {
    try {
        const parsed = TranslationSchema.parse(req.body);

        const { error } = await supabase.from('translations').upsert({
            translation_key: parsed.translation_key,
            uk: stripHtml(parsed.uk),
            pl: stripHtml(parsed.pl),
            en: stripHtml(parsed.en),
            updated_at: new Date().toISOString()
        }, { onConflict: 'translation_key' });

        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
        res.status(500).json({ error: e.message });
    }
};

export const deleteTranslation = async (req, res) => {
    try {
        const { key } = req.params;
        if (!key || key.trim() === '') return res.status(400).json({ error: 'Missing translation key' });
        const { error } = await supabase.from('translations').delete().eq('translation_key', key);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};