import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            const ext = path.extname(file);
            if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });
    return arrayOfFiles;
}

function extractTranslationKeys(content) {
    const keys = new Set();
    // Регулярка для пошуку t('...'), t("..."), t(`...`)
    // Увага: вона витягне і динамічні змінні всередині шаблонних строк, але ми намагаємось відфільтрувати їх
    const regex = /t\(\s*['"`](.*?)['"`]\s*[,\)]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        // Відкидаємо динамічні ключі з ${}
        if (!key.includes('${')) {
            keys.add(key);
        }
    }
    return Array.from(keys);
}

async function syncTranslations() {
    console.log('🔍 Сканування кодової бази...');
    const srcDir = path.resolve(__dirname, '../src');
    const files = getAllFiles(srcDir);
    
    const usedKeysSet = new Set();
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const fileKeys = extractTranslationKeys(content);
        fileKeys.forEach(k => usedKeysSet.add(k));
    });

    const usedKeys = Array.from(usedKeysSet);
    console.log(`✅ Знайдено ${usedKeys.length} унікальних ключів перекладів у коді.`);

    console.log('⬇️ Завантаження існуючих перекладів з БД...');
    let dbKeys = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;
    while (hasMore) {
        const { data, error } = await supabase.from('translations').select('translation_key').range(from, from + limit - 1);
        if (error) throw error;
        dbKeys = [...dbKeys, ...data.map(d => d.translation_key)];
        if (data.length < limit) hasMore = false;
        else from += limit;
    }
    console.log(`✅ Знайдено ${dbKeys.length} ключів у базі даних.`);

    const dbKeysSet = new Set(dbKeys);
    
    const keysToAdd = usedKeys.filter(k => !dbKeysSet.has(k));
    const keysToRemove = dbKeys.filter(k => !usedKeysSet.has(k));

    console.log(`\n📊 Результат порівняння:`);
    console.log(`➕ Нових ключів для додавання: ${keysToAdd.length}`);
    console.log(`➖ Зайвих ключів для видалення: ${keysToRemove.length}`);

    if (keysToAdd.length > 0) {
        console.log('\n⏳ Додавання нових ключів...');
        // Додаємо пачками по 500
        for (let i = 0; i < keysToAdd.length; i += 500) {
            const batch = keysToAdd.slice(i, i + 500).map(key => ({
                translation_key: key,
                uk: key, // Можна зробити порожнім, або залишити як ключ
                en: '',
                pl: ''
            }));
            const { error } = await supabase.from('translations').insert(batch);
            if (error) {
                console.error(`❌ Помилка при додаванні: ${error.message}`);
                throw error;
            }
        }
        console.log('✅ Усі нові ключі додано!');
    }

    if (keysToRemove.length > 0) {
        console.log('\n⏳ Видалення старих ключів...');
        // Видаляємо пачками по 500
        for (let i = 0; i < keysToRemove.length; i += 500) {
            const batch = keysToRemove.slice(i, i + 500);
            const { error } = await supabase.from('translations').delete().in('translation_key', batch);
            if (error) {
                console.error(`❌ Помилка при видаленні: ${error.message}`);
                throw error;
            }
        }
        console.log('✅ Усі старі ключі видалено!');
    }

    if (keysToAdd.length === 0 && keysToRemove.length === 0) {
        console.log('\n🎉 Все актуально! Змін не потрібно.');
    } else {
        console.log('\n🎉 Синхронізація успішно завершена!');
    }
}

syncTranslations().catch(e => {
    console.error('❌ Помилка виконання скрипта:', e);
});
