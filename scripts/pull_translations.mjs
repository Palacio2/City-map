import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function pull() {
  console.log('⬇️ Завантаження перекладів з БД...');
  let allData = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.from('translations').select('*').order('translation_key').range(from, from + limit - 1);
    if (error) throw error;
    allData = [...allData, ...data];
    if (data.length < limit) hasMore = false;
    else from += limit;
  }

  const bundles = { uk: {}, en: {}, pl: {} };
  allData.forEach(item => {
    if (item.uk) bundles.uk[item.translation_key] = item.uk;
    if (item.en) bundles.en[item.translation_key] = item.en;
    if (item.pl) bundles.pl[item.translation_key] = item.pl;
  });

  if (!fs.existsSync('./public/locales')) fs.mkdirSync('./public/locales', { recursive: true });
  fs.writeFileSync('./public/locales/translations.json', JSON.stringify(bundles, null, 2));
  console.log('✅ Переклади збережено в public/locales/translations.json');
}

pull();
