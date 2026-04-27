import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Отримати всі переклади
export const getTranslations = async (req, res) => {
    try {
        // Додаємо .limit(5000) щоб обійти стандартне обмеження Supabase у 1000 записів
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

// Зберегти або оновити переклад
export const saveTranslation = async (req, res) => {
    try {
        const { translation_key, uk, pl, en } = req.body;
        
        // upsert оновлює існуючий ключ або створює новий
        const { error } = await supabase.from('translations').upsert({
            translation_key, uk, pl, en, updated_at: new Date().toISOString()
        }, { onConflict: 'translation_key' });
        
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// Видалити переклад
export const deleteTranslation = async (req, res) => {
    try {
        const { key } = req.params;
        const { error } = await supabase.from('translations').delete().eq('translation_key', key);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};