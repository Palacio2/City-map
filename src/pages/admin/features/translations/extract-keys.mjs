import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Піднімаємося на 5 рівнів вгору до кореня city-maps
const ROOT_PATH = path.resolve(__dirname, '../../../../../');

const SRC_PATH = path.join(ROOT_PATH, 'src');
const SERVER_PATH = path.join(ROOT_PATH, 'server');
const OUTPUT_FILE = path.join(SRC_PATH, 'extracted_keys.json');

/** * ПОКРАЩЕНИЙ REGEX: 
 * Шукає t('...'), t("...") або t(`...`)
 * Група (match[1]) захоплює системні ключі (літери, цифри, крапки, підкреслення та двокрапки).
 * Він зупиниться перед закриваючими лапками або символами на кшталт + чи ${
 */
const KEY_REGEX = /(?:^|[^a-zA-Z0-9_$])t\(['"`]([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9._:]+)*)/g;

function getFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('node_modules') || filePath.includes('dist')) return;
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else if (filePath.match(/\.(js|jsx|ts|tsx|mjs)$/)) {
            results.push(filePath);
        }
    });
    return results;
}

console.log('--- Ініціалізація пошуку ключів ---');
console.log('Шлях до SRC:', SRC_PATH);
console.log('Шлях до SERVER:', SERVER_PATH);

const keys = new Set([
    // Hardcoded keys from configuration objects
    'admin_panel.sections.analytics',
    'admin_panel.sections.data_content',
    'admin_panel.sections.users',
    'admin_panel.sections.system',
    'admin_roles.desc.dashboard',
    'admin_roles.desc.map',
    'admin_roles.desc.parser',
    'admin_roles.actions.parser_scan_osm',
    'admin_roles.actions.parser_create_districts',
    'admin_roles.actions.parser_run_offline',
    'admin_roles.actions.parser_import_geojson',
    'admin_roles.actions.parser_delete_districts',
    'admin_roles.desc.manual',
    'admin_roles.actions.manual_create_country',
    'admin_roles.actions.manual_create_city',
    'admin_roles.actions.manual_create_district',
    'admin_roles.actions.manual_edit',
    'admin_roles.actions.manual_gis',
    'admin_roles.actions.manual_save',
    'admin_roles.actions.manual_delete',
    'admin_roles.desc.scraper',
    'admin_roles.actions.scraper_add_rule',
    'admin_roles.actions.scraper_edit_rule',
    'admin_roles.actions.scraper_delete_rule',
    'admin_roles.desc.users',
    'admin_roles.actions.users_assign_cities',
    'admin_roles.actions.users_gift_sub',
    'admin_roles.actions.users_promo_codes',
    'admin_roles.actions.users_terminate',
    'admin_roles.actions.users_delete',
    'admin_roles.desc.comments',
    'admin_roles.actions.comments_hide',
    'admin_roles.actions.comments_delete',
    'admin_roles.desc.feedback',
    'admin_roles.actions.feedback_change_status',
    'admin_roles.actions.feedback_delete',
    'admin_roles.desc.ai',
    'admin_roles.actions.ai_toggle',
    'admin_roles.desc.fields',
    'admin_roles.actions.fields_add',
    'admin_roles.actions.fields_edit',
    'admin_roles.actions.fields_delete',
    'admin_roles.desc.translations',
    'admin_roles.actions.translations_add',
    'admin_roles.actions.translations_edit',
    'admin_roles.actions.translations_delete',
    'admin_roles.actions.translations_audit',
    'admin_roles.desc.notifications',
    'admin_roles.actions.notifications_send',
    'admin_roles.desc.audit'
]);
const allFiles = [...getFiles(SRC_PATH), ...getFiles(SERVER_PATH)];

console.log(`Проскановано файлів: ${allFiles.length}`);

allFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        KEY_REGEX.lastIndex = 0; 
        
        while ((match = KEY_REGEX.exec(content)) !== null) {
            const key = match[1];
            // ФІЛЬТР: Ключ повинен містити крапку (структура abc.xyz) 
            // і не бути просто технічним словом
            if (key.includes('.') && key.length > 3) {
                keys.add(key);
            }
        }
    } catch (err) {}
});

try {
    // Сортуємо ключі за алфавітом для зручності
    const sortedKeys = Array.from(keys).sort();
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedKeys, null, 2));
    
    console.log('-----------------------------------');
    console.log(`✅ Успішно! Знайдено унікальних ключів/префіксів: ${keys.size}`);
    console.log(`📂 Файл оновлено: src/extracted_keys.json`);
    console.log('-----------------------------------');
} catch (err) {
    console.error('❌ Помилка запису файлу:', err);
}