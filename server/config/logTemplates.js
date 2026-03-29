export const LOGS = {
    START: (city, count) => `🚀 ПІДГОТОВКА: ${city} | Районів: ${count}`,
    PROGRESS: (cur, total, name, pct) => `⏳ [${cur}/${total}] (${pct}%) Обробка: ${name}`,
    STEP_TIME: (step, time) => `⏱️ Етап [${step}] виконано за ${time}ms`,
    END: (count, totalTime) => `🎉 ПАРСИНГ ЗАВЕРШЕНО! Районів: ${count} | Загальний час: ${totalTime}s`,

    DB_GEO_FETCH: () => `📦 Запит гео-даних з БД...`,
    DB_GEO_SUCCESS: (count) => `✅ Гео-дані завантажено (${count} шт.)`,
    QUEUE_LOCKED: () => `⚠️ Парсер вже працює. Запит відхилено.`,
    
    OSM_START: (file) => `🗺️ Початок читання PBF: ${file}`,
    OSM_PASS_1: (count, ms) => `🔎 Прохід 1 (Шляхи): Знайдено ${count} об'єктів (${ms}ms)`,
    OSM_PASS_2: (count, ms) => `📍 Прохід 2 (Точки): Прочитано ${count} координат (${ms}ms)`,
    OSM_SUCCESS: (name, count, foundStr, zeroStr) => `📍 OSM [${name}]: Разом ${count} шт.\n   ✅ Знайдено: ${foundStr || 'нічого'}\n   ❌ По нулях: ${zeroStr || 'немає'}`,
    
    MACRO_SUCCESS: (salary, density) => `💰 Економіка: ЗП ${salary}, Щільність ${density}`,
    AQI_FETCH: (lat, lon) => `🌐 WAQI API Запит: [${lat}, ${lon}]`,
    AQI_SUCCESS: (name, val) => `🍃 AQI [${name}]: ${val}`,
    AQI_FAIL: (name) => `⚠️ AQI [${name}]: Дані відсутні або таймаут`,
    
    PROP_FETCH: (url) => `🌐 Scraper Запит: ${url}`,
    PROP_SUCCESS: (name, msg) => `🏠 Нерухомість [${name}]: ${msg}`,
    
    ERR_CRITICAL: (err) => `❌ КРИТИЧНА ПОМИЛКА: ${err}`,
    ERR_STEP: (step, err) => `⚠️ Помилка [${step}]: ${err}`,
    ERR_DATA_MISSING: (field) => `⚠️ Відсутні дані: ${field}`,
    ERR_PARSE: (context, err) => `⚠️ Помилка обробки [${context}]: ${err}`
};