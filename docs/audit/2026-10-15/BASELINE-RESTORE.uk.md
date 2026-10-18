# F06 — відтворювана БД: стан і перевірка

> Актуальний стан застосування міграцій і Edge на 18.10: [DATABASE-ROLLOUT.uk.md](../../DATABASE-ROLLOUT.uk.md). Наведені нижче початкові локальні перевірки не замінюють цей стан.

F06 не виправлено. У ланцюжку немає базових таблиць, функцій, grants, policies та storage-конфігурації. Додавання лише cities/admin_users або використання спрощених PGlite fixtures не є baseline.

17.10.2026 read-only інвентаризація production: PostgreSQL 17.4, 29 public tables і 66 public functions. Це опис живої БД, не локальних ще не застосованих міграцій. Дані користувачів не читались. Спроба schema-only `supabase db dump --linked --schema public` завершилась помилкою через відсутній Docker; SQL dump не отримано. CLI використовував штатну ініціалізацію login role для доступу; application schema/data не змінювалися.

## Чиста перевірка

`npm run check:db:clean` вимагає доступні Docker Engine і Supabase CLI 2.113.0. Скрипт створює у scratch окремий project_id та копію лише config/migrations. Не копіює .temp, .env, credentials або project link. Запускає локальні сервіси, потім `db reset --local --no-seed`. Завершення прибирає лише Docker volumes цього нового disposable project, не інші локальні БД. Робочі файли лишаються у scratch для діагностики.

Окремий GitHub Actions workflow **Clean database restore** запускається вручну без production secrets. Поки baseline відсутній, очікується FAIL на першій відсутній залежності. Звичайний npm run check не замінює цей тест. Після усунення F06 цей workflow треба зробити обов’язковим release check.

## Що потрібно для закриття

1. На середовищі з Docker отримати schema-only export, включно з public definitions та окремо application-owned storage policies/bucket configuration. Перевірити функції/defaults/comments на secrets перед додаванням файлу до Git. Не експортувати auth users, storage objects, контакти або платежі.
2. Звірити export із deployed migration history: він уже містить частину міграцій. Не вставляти його бездумно перед старими файлами — це створить дублікати policies/triggers і може повернути старі grants.
3. Підготувати узгоджений baseline/squash і окремий план для існуючої БД; не змінювати її migration history, не виконувати reset/repair під час підготовки.
4. Внести ще не розгорнуті release migrations у правильному порядку. Усунути історичне посилання stage2 на неіснуючу admin_users через узгоджену історію, а не фальшиву таблицю.
5. Успішно виконати clean restore на реальному локальному Supabase, далі permission/RLS/Storage smoke. Перевірити compatibility уже розгорнутої історії окремо.

Без успішного restore та порівняння історій F06 залишається відкритим. Новий runner/workflow — перевірка, а не виправлення відсутньої схеми.

## Уточнення 18.10.2026

Подальше рішення користувача: встановлення Docker та F06 поки відкласти. Docker/WSL не встановлювати й не повертатися до встановлення без поновлення цього завдання користувачем. Нижче збережено попередню діагностику.

Read-only перевірка migration history підтвердила 13 записів, від 20260826102400 до 20261014171920. Збережений SQL stage2 також посилається на `admin_users`: це історична залежність, а не лише помилка локального файлу. Початкового створення всієї схеми в історії немає. Видалений застарілий supabase_schema.json був Swagger-описом API, а не SQL baseline.

Docker Desktop і PostgreSQL CLI не встановлені; WSL також повідомляє, що не встановлений. Windows 11 Pro, build 26200. На момент перевірки вільно приблизно 8,5 GiB на C: та 247,1 GiB на D:.

Користувач дозволяє встановлення за умови помірного розміру й розташування суто на D:. Офіційний Docker installer підтримує `--installation-dir` і `--wsl-default-data-root`, але це не гарантує відсутності службових файлів та Windows/WSL-компонентів на C:. Встановлення не розпочато; потрібне уточнення допустимості таких системних записів. Пропоновані основні шляхи: `D:\Docker\Desktop` і `D:\Docker\Data`. Без погодження винятку для C: локальне встановлення не виконувати.

Під час підготовки також виявлено й виправлено застарілу вимогу у `supabase/tests/security_access.sql`: замість очікування service_role EXECUTE на retired `force_logout_user(text)` перевіряються заборона старого шляху та належні права на `admin_terminate_user_sessions(uuid,uuid)`. Сам блок privilege checks виконано в PGlite, включно з негативними сценаріями. Це не означає, що повний restore чи staging smoke вже виконані.

Документація: https://docs.docker.com/desktop/setup/install/windows-install/ та https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore . Production schema/data/history не змінювалися.
