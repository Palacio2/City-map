import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const requireAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('No token provided');

        // getUser перевіряє токен на криптографічну валідність і термін дії
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid token');

        // Миттєва перевірка ролі прямо з токена (без запиту до таблиці!)
        if (user.app_metadata?.role !== 'admin') {
            throw new Error('Access Denied: You are not an administrator.');
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(403).json({ error: err.message || 'Forbidden' });
    }
};