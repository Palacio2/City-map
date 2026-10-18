/**
 * collect_translation_keys.mjs
 * ============================
 * Потужний збирач ключів перекладу для проекту city-maps.
 *
 * Що вміє:
 *  1. Знаходить статичні t('key'), t("key"), t(`key`) — будь-які лапки
 *  2. Ігнорує файли без useTranslation / i18n
 *  3. НЕ тягне ключі з import-рядків
 *  4. Обробляє масиви ключів: t(['key1', 'key2'])
 *  5. Обробляє i18nKey="..." у JSX <Trans>
 *  6. Розгортає template literals з ${} через таблицю KNOWN_TOKENS
 *  7. Виводить діагностику нерозгорнутих динамічних паттернів
 *
 * Запуск: node scripts/collect_translation_keys.mjs [--dry-run] [--verbose]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── НАЛАШТУВАННЯ ────────────────────────────────────────────────────────────

const SRC_DIR = path.resolve(__dirname, '../src');
const OUT_PATH = path.resolve(__dirname, '../src/i18n/dynamicKeysManifest.ts');

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const VERBOSE = ARGS.includes('--verbose');

// ─── ВІДОМІ ТОКЕНИ ДЛЯ РОЗГОРТАННЯ ШАБЛОНІВ ─────────────────────────────────
// Для кожного виразу ${expr} задаємо список значень для підстановки.
// Ключ = точний JavaScript-вираз всередині ${}, значення = масив рядків.

const KNOWN_TOKENS = {
  // header.lang_${lang}
  'lang': ['uk', 'en', 'pl'],

  // groups.${cat.key}, common.categories.${cat.key} тощо
  'cat.id':           ['economics', 'education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],
  'cat.key':          ['economics', 'education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],
  'category.key':     ['economics', 'education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],
  'categoryConfig.key':['economics','education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],
  'catKey':           ['economics', 'education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],
  'group':            ['economics', 'education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],
  'category':         ['economics', 'education', 'medicine', 'commerce', 'culture_leisure', 'sports', 'transport', 'security'],

  // admin_notifications.types.${n.type}
  'n.type': ['info', 'warning', 'error', 'success'],

  // common.units.${unit}
  'unit': ['m', 'km', 'sqm', 'min', 'USD', 'UAH', '%', 'score'],

  // common.enums.${aqiEnum}
  'aqiEnum': ['low', 'medium', 'high', 'good', 'bad', 'medium_level', 'very_high', 'hazardous'],

  // billing.status_map.${statusLower}
  'statusLower': ['active', 'cancelled', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'past_due', 'trialing', 'paused', 'unknown'],
  'status':      ['active', 'cancelled', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'past_due', 'trialing', 'paused', 'unknown'],
  'item.status': ['active', 'cancelled', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'past_due', 'trialing', 'paused', 'unknown'],

  // billing.plans.${planKey}.name / billing.plans.${actualPlanKey}.price тощо
  'plan':         ['free', 'weekly', 'premium', 'realtor', 'pro'],
  'item.plan':    ['free', 'weekly', 'premium', 'realtor', 'pro'],
  'planKey':      ['free', 'weekly', 'premium', 'realtor', 'pro'],
  'actualPlanKey':['free', 'weekly', 'premium', 'realtor', 'pro'],
  'selectedPlan': ['free', 'weekly', 'premium', 'realtor', 'pro'],
  // ${key} — Object.keys(subscriptionPlans) у PlanSelector
  'key':          ['free', 'weekly', 'premium', 'realtor', 'pro'],

  // faq.questions.${activeCategory}
  'activeCategory': ['general', 'pricing', 'technical', 'data'],

  // subscription.features.${f} / subscription.features.${featureKey}
  'f': [
    'compare_districts', 'advanced_filters', 'export_pdf', 'real_estate_analytics', 'support',
    'district_limit_5', 'filters_limit_2', 'basic_rating',
    'safety_edu_analytics', 'financial_stats', 'favorites_save', 'compare_tools', 'pdf_export',
    'unlimited_districts', 'extended_filters', 'partial_analytics', 'personal_stats', 'save_favorites', 'pdf_download',
    'all_weekly_features', 'all_premium_features', 'roi_calculator', 'white_label_pdf',
    'compare_4_districts', 'full_filter_access', 'full_district_info',
    'popular_districts_monitor', 'growth_tracking',
  ],
  'feature': [
    'compare_districts', 'advanced_filters', 'export_pdf', 'real_estate_analytics', 'support',
    'district_limit_5', 'filters_limit_2', 'basic_rating',
    'safety_edu_analytics', 'financial_stats', 'favorites_save', 'compare_tools', 'pdf_export',
    'unlimited_districts', 'extended_filters', 'partial_analytics', 'personal_stats', 'save_favorites', 'pdf_download',
    'all_weekly_features', 'all_premium_features', 'roi_calculator', 'white_label_pdf',
    'compare_4_districts', 'full_filter_access', 'full_district_info',
    'popular_districts_monitor', 'growth_tracking',
  ],
  'featureKey': [
    'compare_districts', 'advanced_filters', 'export_pdf', 'real_estate_analytics', 'support',
    'district_limit_5', 'filters_limit_2', 'basic_rating',
    'safety_edu_analytics', 'financial_stats', 'favorites_save', 'compare_tools', 'pdf_export',
    'unlimited_districts', 'extended_filters', 'partial_analytics', 'personal_stats', 'save_favorites', 'pdf_download',
    'all_weekly_features', 'all_premium_features', 'roi_calculator', 'white_label_pdf',
    'compare_4_districts', 'full_filter_access', 'full_district_info',
    'popular_districts_monitor', 'growth_tracking',
  ],

  // common.fields.${fieldData.key} / common.fields.${filter.name} тощо
  'fieldData.key': [
    'bus_stops_count', 'parking_spots_count', 'schools_count', 'hospitals_count',
    'pharmacies_count', 'supermarkets_count', 'restaurants_count', 'cafes_count',
    'gyms_count', 'parks_count', 'kindergartens_count', 'clinics_count',
    'average_salary', 'unemployment_rate', 'average_sale_price_sqm', 'utilities_cost_per_sqm',
    'population', 'propertyPricePerSqm', 'average_rent_price',
  ],
  'filter.name': [
    'bus_stops_count', 'parking_spots_count', 'schools_count', 'hospitals_count',
    'pharmacies_count', 'supermarkets_count', 'restaurants_count', 'cafes_count',
    'gyms_count', 'parks_count', 'kindergartens_count', 'clinics_count',
    'average_salary', 'unemployment_rate', 'average_sale_price_sqm', 'utilities_cost_per_sqm',
    'population', 'propertyPricePerSqm', 'average_rent_price',
  ],
  'f.key': [
    'bus_stops_count', 'parking_spots_count', 'schools_count', 'hospitals_count',
    'pharmacies_count', 'supermarkets_count', 'restaurants_count', 'cafes_count',
    'gyms_count', 'parks_count', 'kindergartens_count', 'clinics_count',
    'average_salary', 'unemployment_rate', 'average_sale_price_sqm', 'utilities_cost_per_sqm',
    'population', 'propertyPricePerSqm', 'average_rent_price',
  ],
  'baseKey': [
    'bus_stops', 'parking_spots', 'schools', 'hospitals', 'pharmacies',
    'supermarkets', 'restaurants', 'cafes', 'gyms', 'parks', 'kindergartens', 'clinics',
  ],
  'withCount': [
    'bus_stops_count', 'parking_spots_count', 'schools_count', 'hospitals_count',
    'pharmacies_count', 'supermarkets_count', 'restaurants_count', 'cafes_count',
    'gyms_count', 'parks_count', 'kindergartens_count', 'clinics_count',
  ],
  'withoutCount': [
    'bus_stops', 'parking_spots', 'schools', 'hospitals', 'pharmacies',
    'supermarkets', 'restaurants', 'cafes', 'gyms', 'parks', 'kindergartens', 'clinics',
  ],
};

// ─── УТИЛІТИ ─────────────────────────────────────────────────────────────────

function log(...args) {
  if (VERBOSE) console.log(...args);
}

/** Файл використовує i18n? */
function fileUsesI18n(content) {
  // Явний імпорт useTranslation або i18n
  if (/useTranslation/.test(content)) return true;
  if (/from ['"]react-i18next['"]/.test(content)) return true;
  if (/i18nKey\s*=/.test(content)) return true;
  if (/import.*i18next/.test(content)) return true;

  // Файл отримує t через хук (деструктуризація: t } = useSomething() або { t, ... } = ...)
  // Просто перевіряємо чи є реальні виклики t('...') або t(`...`)
  // (не import, не коментар)
  if (/\bt\s*\(\s*['"`]/.test(content)) return true;

  return false;
}

/** Рядок є import-декларацією */
function isImportLine(line) {
  return /^\s*import\s/.test(line.trimStart());
}

/**
 * Розв'язує ${expr} -> масив можливих значень.
 * Підтримує:
 *  - точний збіг: 'lang', 'cat.key' тощо
 *  - case-insensitive збіг
 */
function resolveTokens(expr, context) {
  const trimmed = expr.trim();
  if (KNOWN_TOKENS[trimmed]) return KNOWN_TOKENS[trimmed];

  // Пробуємо case-insensitive
  for (const [k, v] of Object.entries(KNOWN_TOKENS)) {
    if (k.toLowerCase() === trimmed.toLowerCase()) return v;
  }

  // Можливо зайві пробіли або спецсимволи
  const normalized = trimmed.replace(/\s+/g, '');
  if (KNOWN_TOKENS[normalized]) return KNOWN_TOKENS[normalized];

  return null; // не знайдено
}

/**
 * Безпечне екранування ключа для вставки у JS рядок з апострофами
 */
function escapeKey(key) {
  return key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ─── ПАРСЕР КЛЮЧІВ З РЯДКА ───────────────────────────────────────────────────

/**
 * Основна функція парсингу одного рядка коду.
 * Повертає { staticKeys: string[], unresolved: {pattern, expr}[] }
 */
function extractKeysFromLine(line) {
  if (isImportLine(line)) return { staticKeys: [], unresolved: [] };

  const staticKeys = [];
  const unresolved = [];

  // ── 1. i18nKey="key" або i18nKey='key' ───────────────────────────────────
  {
    const re = /i18nKey\s*=\s*["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      staticKeys.push(m[1]);
    }
  }

  // ── 2. t(['key1', 'key2', ...]) — масив ──────────────────────────────────
  {
    const re = /\bt\s*\(\s*\[([^\]]*)\]/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const inner = m[1];
      // Витягуємо всі рядкові літерали (без template з ${})
      const strRe = /["'`]([^"'`$\n{]+)["'`]/g;
      let sm;
      while ((sm = strRe.exec(inner)) !== null) {
        staticKeys.push(sm[1]);
      }
    }
  }

  // ── 3. t('key') або t("key") — статичний рядок ───────────────────────────
  // Масиви t([...]) вже оброблені вище, тут шукаємо лише прямі рядкові аргументи
  {
    const re = /\bt\s*\(\s*(['"])([^'"$\n{}]+)\1/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      staticKeys.push(m[2]);
    }
  }

  // ── 4. t(`static.key`) — backtick без interpolation ──────────────────────
  {
    const re = /\bt\s*\(\s*`([^`${}]+)`/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      staticKeys.push(m[1]);
    }
  }

  // ── 5. t(`prefix.${expr}suffix`) — template з interpolation ─────────────
  // Підтримує один ${} у шаблоні (найпоширеніший випадок)
  {
    const re = /\bt\s*\(\s*`([^`]*?)\$\{([^}]+)\}([^`]*?)`/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const prefix = m[1];
      const expr   = m[2].trim();
      const suffix = m[3];

      const tokens = resolveTokens(expr, line);
      if (tokens && tokens.length > 0) {
        for (const val of tokens) {
          const key = `${prefix}${val}${suffix}`;
          if (!key.includes('${') && isValidKey(key)) {
            staticKeys.push(key);
          }
        }
      } else {
        unresolved.push({ pattern: `${prefix}\${${expr}}${suffix}`, expr });
      }
    }
  }

  return { staticKeys, unresolved };
}

/**
 * Перевіряє чи позиція pos знаходиться всередині [...] у рядку
 */
function isPositionInsideArrayBracket(line, pos) {
  let depth = 0;
  for (let i = 0; i < pos && i < line.length; i++) {
    if (line[i] === '[') depth++;
    if (line[i] === ']') depth--;
  }
  return depth > 0;
}

/**
 * Валідація ключа перекладу
 */
function isValidKey(key) {
  if (!key || typeof key !== 'string') return false;
  const k = key.trim();
  if (k.length < 2) return false;                     // занадто короткий
  if (k.includes('${')) return false;                  // нерозгорнутий шаблон
  if (/[\n\r\t]/.test(k)) return false;               // переноси рядків
  if (/^https?:\/\//.test(k)) return false;            // URL
  if (/^[./]/.test(k)) return false;                   // шляхи файлів
  if (k.endsWith('.')) return false;                  // незавершений префікс
  if (/^\d+$/.test(k)) return false;                   // числа
  // Ключі мають містити літери
  if (!/[a-zA-Z]/.test(k)) return false;
  return true;
}

// ─── СКАНУВАННЯ ──────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '__snapshots__', '.vscode']);

function getAllSourceFiles(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllSourceFiles(full, result);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!fileUsesI18n(content)) return { keys: new Set(), unresolved: [] };

  const keys = new Set();
  const allUnresolved = [];

  // ── Прохід 1: рядок за рядком (ловить однорядкові виклики) ──────────────
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const { staticKeys, unresolved } = extractKeysFromLine(lines[i]);

    for (const k of staticKeys) {
      if (isValidKey(k)) {
        keys.add(k.trim());
      } else {
        log(`  ⚠️  Некоректний ключ пропущено: "${k}" (${path.basename(filePath)}:${i + 1})`);
      }
    }

    for (const u of unresolved) {
      allUnresolved.push({ ...u, file: path.basename(filePath), line: i + 1 });
    }
  }

  // ── Прохід 2: весь файл одразу (ловить MULTI-LINE виклики типу t(\n  'key')) ─
  // Видаляємо import-рядки перед пошуком
  const contentNoImports = content
    .split(/\r?\n/)
    .filter(l => !isImportLine(l))
    .join('\n');

  // t(  \n  'key'  \n  ) — пробіли та переноси між t( і рядком-ключем
  const multiLineRe = /\bt\s*\(\s*\n\s*['"]([^'"$\n{}]+)['"]/g;
  let m;
  while ((m = multiLineRe.exec(contentNoImports)) !== null) {
    const k = m[1];
    if (isValidKey(k)) keys.add(k.trim());
  }

  return { keys, unresolved: allUnresolved };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function run() {
  console.log('🔍 Сканування кодової бази для збору ключів перекладу...');
  console.log(`   Директорія: ${SRC_DIR}\n`);

  const files = getAllSourceFiles(SRC_DIR);
  console.log(`   Знайдено ${files.length} файлів`);

  const allKeys = new Set();
  const allUnresolved = [];
  let filesWithI18n = 0;

  for (const file of files) {
    const { keys, unresolved } = scanFile(file);
    if (keys.size > 0 || unresolved.length > 0) {
      filesWithI18n++;
      log(`  📄 ${path.relative(SRC_DIR, file)} → ${keys.size} ключів${unresolved.length > 0 ? `, ${unresolved.length} нерозгорнуто` : ''}`);
    }
    for (const k of keys) allKeys.add(k);
    allUnresolved.push(...unresolved);
  }

  const sorted = Array.from(allKeys).sort();

  console.log(`\n✅ Зібрано ${sorted.length} унікальних ключів з ${filesWithI18n} файлів (з i18n)`);

  // ── Діагностика нерозгорнутих паттернів ──────────────────────────────────
  if (allUnresolved.length > 0) {
    // Дедублікуємо по паттерну
    const uniqueUnresolved = [
      ...new Map(allUnresolved.map(u => [u.pattern, u])).values()
    ];

    console.log(`\n⚠️  Нерозгорнуті динамічні паттерни (${uniqueUnresolved.length} унікальних):`);
    console.log('   Ці виклики t() містять ${} який скрипт не вміє розгорнути автоматично.');
    console.log('   Додай відповідний вираз у KNOWN_TOKENS у цьому скрипті.\n');

    for (const { pattern, expr, file, line } of uniqueUnresolved) {
      console.log(`   t(\`${pattern}\`) → вираз: \${${expr}}`);
      console.log(`   └─ ${file}:${line}`);
    }
  } else {
    console.log('✅ Усі динамічні паттерни успішно розгорнуто!');
  }

  // ── Запис файлу ───────────────────────────────────────────────────────────
  if (!DRY_RUN) {
    const now = new Date().toISOString();
    const lines = [
      `// Цей файл згенеровано АВТОМАТИЧНО скриптом scripts/collect_translation_keys.mjs`,
      `// НЕ редагуй вручну — всі зміни перезапишуться при наступному запуску.`,
      `// Останній запуск: ${now}`,
      `// Ключів: ${sorted.length} | Файлів: ${files.length}`,
      `//`,
      `// Щоб запустити: node scripts/collect_translation_keys.mjs`,
      ``,
      `const t = (k: string) => k;`,
      ``,
      `export const COLLECTED_TRANSLATION_KEYS = [`,
      ...sorted.map(k => `  t('${escapeKey(k)}'),`),
      `];`,
      ``,
    ];

    fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf-8');
    console.log(`\n📝 Файл записано: ${OUT_PATH}`);
  } else {
    console.log(`\n🔵 --dry-run: файл НЕ записано. Ключів зібрано: ${sorted.length}`);
    if (VERBOSE) {
      console.log('\nСписок ключів:');
      for (const k of sorted) console.log(`  ${k}`);
    }
  }
}

run();
