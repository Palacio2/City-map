import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const translations = {
  "admin_panel.access_denied_desc": "У вас немає прав для доступу до цієї сторінки.",
  "admin_panel.access_denied_title": "Доступ заборонено",
  "admin_panel.footer.rights": "Всі права захищено",
  "admin_panel.links.api": "API Документація",
  "admin_panel.links.header": "Корисні посилання",
  "admin_panel.links.security": "Безпека",
  "admin_panel.links.status": "Статус системи",
  "admin_panel.login.back": "Назад",
  "admin_panel.login.cancel": "Скасувати",
  "admin_panel.login.checking": "Перевірка...",
  "admin_panel.login.confirm": "Підтвердити",
  "admin_panel.login.email": "Електронна пошта",
  "admin_panel.login.enter_code": "Введіть код",
  "admin_panel.login.forgot": "Забули пароль?",
  "admin_panel.login.info_btn": "Інформація",
  "admin_panel.login.password": "Пароль",
  "admin_panel.login.scan_desc": "Відскануйте QR-код вашим додатком-автентифікатором",
  "admin_panel.login.scan_qr": "Сканувати QR",
  "admin_panel.login.sign_in": "Увійти",
  "admin_panel.login.six_digit": "6-значний код",
  "admin_panel.login.subtitle": "Система керування",
  "admin_panel.login.title": "Адмін Панель",
  "admin_panel.login.two_factor": "Двофакторна автентифікація",
  "admin_panel.login.verify": "Перевірити",
  "admin_panel.login.verifying": "Перевірка...",
  "admin_panel.sidebar.logout": "Вийти",
  "admin_panel.sidebar.subtitle": "Панель керування",
  "admin_panel.sidebar.title": "City Maps",
  "admin_panel.stats.cities": "Міст",
  "admin_panel.stats.districts": "Районів",
  "admin_panel.stats.users": "Користувачів",
  "admin_panel.status.api_gateway": "API Шлюз",
  "admin_panel.status.database": "База даних",
  "admin_panel.status.healthy": "В нормі",
  "admin_panel.status.offline": "Офлайн",
  "admin_panel.status.online": "Онлайн",
  "admin_panel.status.unreachable": "Недоступно",
  "admin_panel.tabs.ai": "ШІ Асистент",
  "admin_panel.tabs.audit": "Аудит логів",
  "admin_panel.tabs.comments": "Коментарі",
  "admin_panel.tabs.dashboard": "Дашборд",
  "admin_panel.tabs.feedback": "Відгуки",
  "admin_panel.tabs.fields": "Поля",
  "admin_panel.tabs.manual": "Ручне редагування",
  "admin_panel.tabs.map": "Карта",
  "admin_panel.tabs.notifications": "Сповіщення",
  "admin_panel.tabs.parser": "Парсер",
  "admin_panel.tabs.scraper": "Скрапер",
  "admin_panel.tabs.translations": "Переклади",
  "admin_panel.tabs.users": "Користувачі",
  "admin_panel.tips.header": "Підказки",
  "admin_panel.updates.header": "Оновлення",
  "admin_panel.updates.loading": "Завантаження..."
};

async function fix() {
  console.log("Оновлення перекладів адмін панелі...");
  for (const [key, ukText] of Object.entries(translations)) {
    await supabase.from('translations').update({ uk: ukText }).eq('translation_key', key);
  }
  console.log("Готово!");
}

fix();
