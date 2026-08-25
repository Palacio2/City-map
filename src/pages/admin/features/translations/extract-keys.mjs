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

const keys = new Set();
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