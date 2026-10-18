import { resolveSupabaseKey } from '../shared/supabaseKeys.js';
/**
 * sync_translations_db.mjs
 * ========================
 * Синхронізує ключі перекладу між кодовою базою та таблицею `translations` в Supabase.
 *
 * Порядок роботи:
 *  1. Запускає collect_translation_keys.mjs → оновлює dynamicKeysManifest.ts
 *  2. Зчитує зібрані ключі з manifest файлу
 *  3. Завантажує поточні ключі з БД
 *  4. Додає нові ключі (яких немає в БД)
 *  5. Видаляє застарілі ключі (яких немає в коді) — за підтвердженням
 *
 * Запуск: node scripts/sync_translations_db.mjs [--no-delete] [--dry-run]
 *
 * Прапори:
 *   --dry-run    — тільки показати різницю, нічого не змінювати в БД
 *   --no-delete  — не видаляти старі ключі з БД
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Читаємо .env з кореня і server/.env (де зберігається SUPABASE_SERVICE_ROLE_KEY)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes('--dry-run');
const NO_DELETE = ARGS.includes('--no-delete');

const MANIFEST_PATH = path.resolve(__dirname, '../src/i18n/dynamicKeysManifest.ts');
const COLLECTOR_PATH = path.resolve(__dirname, './collect_translation_keys.mjs');

// ─── SUPABASE ─────────────────────────────────────────────────────────────────

if (!process.env.VITE_SUPABASE_URL || !resolveSupabaseKey(name => process.env[name], 'secret')) {
  console.error('❌ Не знайдено VITE_SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY у .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  resolveSupabaseKey(name => process.env[name], 'secret')
);

// ─── КРОК 1: Збираємо ключі ───────────────────────────────────────────────────

function collectKeys() {
  console.log('🔧 Запуск збирача ключів (collect_translation_keys.mjs)...');
  try {
    execSync(`node "${COLLECTOR_PATH}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Помилка при зборі ключів:', err.message);
    process.exit(1);
  }
}

// ─── КРОК 2: Читаємо ключі з manifest ────────────────────────────────────────

function readKeysFromManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Файл manifest не знайдено: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');

  // Витягуємо всі t('key') з файлу — простий надійний regex для нашого manifest
  const keys = new Set();
  const re = /\bt\s*\(\s*'([^']+)'\s*\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    keys.add(m[1]);
  }

  return Array.from(keys).sort();
}

// ─── КРОК 3: Завантажуємо ключі з БД ─────────────────────────────────────────

async function fetchDbKeys() {
  const allKeys = [];
  let from = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('translations')
      .select('translation_key')
      .range(from, from + limit - 1);

    if (error) throw error;
    allKeys.push(...data.map(d => d.translation_key));
    if (data.length < limit) break;
    from += limit;
  }

  return allKeys;
}

// ─── ГОЛОВНА ФУНКЦІЯ ──────────────────────────────────────────────────────────

async function syncTranslations() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  🌐 Синхронізація ключів перекладу з БД');
  if (DRY_RUN) console.log('  🔵 Режим: dry-run (БД не змінюється)');
  if (NO_DELETE) console.log('  ⚠️  Видалення старих ключів вимкнено');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Збираємо ключі
  collectKeys();

  // 2. Читаємо з manifest
  const usedKeys = readKeysFromManifest();
  console.log(`\n✅ Знайдено ${usedKeys.length} ключів у коді (після збору)`);

  // 3. Завантажуємо з БД
  console.log('⬇️  Завантаження поточних ключів з БД...');
  const dbKeys = await fetchDbKeys();
  console.log(`✅ Знайдено ${dbKeys.length} ключів у базі даних`);

  // 4. Порівняння
  const usedSet = new Set(usedKeys);
  const dbSet = new Set(dbKeys);

  const keysToAdd = usedKeys.filter(k => !dbSet.has(k));
  const keysToRemove = NO_DELETE ? [] : dbKeys.filter(k => !usedSet.has(k));

  console.log(`\n📊 Результат порівняння:`);
  console.log(`   ➕ Нових ключів для додавання: ${keysToAdd.length}`);
  console.log(`   ➖ Застарілих ключів для видалення: ${keysToRemove.length}${NO_DELETE ? ' (пропускається)' : ''}`);

  if (keysToAdd.length > 0) {
    console.log('\n   Нові ключі:');
    for (const k of keysToAdd) console.log(`   + ${k}`);
  }

  if (keysToRemove.length > 0 && !NO_DELETE) {
    console.log('\n   Ключі для видалення:');
    for (const k of keysToRemove) console.log(`   - ${k}`);
  }

  if (DRY_RUN) {
    console.log('\n🔵 Dry-run: зміни НЕ внесено в БД.');
    return;
  }

  // 5. Додаємо нові ключі
  if (keysToAdd.length > 0) {
    console.log('\n⏳ Додавання нових ключів...');
    for (let i = 0; i < keysToAdd.length; i += 500) {
      const batch = keysToAdd.slice(i, i + 500).map(key => ({
        translation_key: key,
        uk: '',
        en: '',
        pl: ''
      }));
      const { error } = await supabase.from('translations').insert(batch);
      if (error) {
        console.error(`❌ Помилка при додаванні: ${error.message}`);
        throw error;
      }
    }
    console.log(`✅ Додано ${keysToAdd.length} нових ключів!`);
  }

  // 6. Видаляємо застарілі ключі
  if (!NO_DELETE && keysToRemove.length > 0) {
    console.log('\n⏳ Видалення застарілих ключів...');
    for (let i = 0; i < keysToRemove.length; i += 500) {
      const batch = keysToRemove.slice(i, i + 500);
      const { error } = await supabase
        .from('translations')
        .delete()
        .in('translation_key', batch);
      if (error) {
        console.error(`❌ Помилка при видаленні: ${error.message}`);
        throw error;
      }
    }
    console.log(`✅ Видалено ${keysToRemove.length} застарілих ключів!`);
  }

  if (keysToAdd.length === 0 && (NO_DELETE || keysToRemove.length === 0)) {
    console.log('\n🎉 Все актуально! Змін не потрібно.');
  } else {
    console.log('\n🎉 Синхронізація успішно завершена!');
  }
}

syncTranslations().catch(e => {
  console.error('❌ Критична помилка:', e);
  process.exit(1);
});
