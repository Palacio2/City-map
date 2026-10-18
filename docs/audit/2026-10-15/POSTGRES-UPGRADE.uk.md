# F08 — підготовка оновлення PostgreSQL

> Актуальний стан застосування міграцій і Edge на 18.10: [DATABASE-ROLLOUT.uk.md](../../DATABASE-ROLLOUT.uk.md). Наведені нижче початкові локальні перевірки не замінюють цей стан.

18.10.2026 виконано лише читання metadata та security advisors. Оновлення, pause/restart, видалення extensions/slots і зміни production не виконувалися.

Підтверджено PostgreSQL 17.4, advisor повідомляє про security patches для `supabase-postgres-17.4.1.074`. У момент перевірки: 0 prepared transactions, 0 транзакцій старших за 5 хвилин, 0 logical replication slots. Встановлені extensions: pg_stat_statements 1.11, pg_trgm 1.6, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1.

Ці результати не підтверджують готовність до upgrade. Ще потрібно перевірити доступний саме цьому проєкту target version, попередження платформи, read replicas, свіжу придатну резервну копію й оцінку downtime у Dashboard. F06/локальний Docker відкладені користувачем; їх не вважати виконаним restore test.

За [документацією Supabase](https://supabase.com/docs/guides/platform/upgrading) upgrade тимчасово робить проєкт недоступним. Перед запуском потрібне погоджене вікно обслуговування, перевірена резервна копія та відсутність блокерів платформи. Не видаляти репліки, slots чи extensions автоматично заради проходження перевірки.

Після upgrade: повторити перевірку версії/advisors, перевірити login/refresh/MFA, тарифний доступ до районів, admin permissions, тестовий Checkout і webhook, приватний Storage, parser queue та логи. Не суміщати upgrade із неперевіреним масовим розгортанням локальних міграцій: це ускладнить пошук причини збою.

## Окремі попередження advisors

Попередження про `popular_cities_view`, старі RPC, mutable search_path, pg_trgm у public і leaked password protection були описані в первинному аудиті (актуальний стан — REMEDIATION.uk.md). Це не нові 41 знахідка і не доказ застосування локальних виправлень. Частина змін ще чекає deployment; решту налаштувань треба перевірити окремо.

Для 21 назви legacy-функцій підготовлено `20261017230818_harden_legacy_function_search_path.sql`: заборона CREATE у public для browser roles, перевірка успадкованих прав, фіксація `public, pg_temp` лише коли немає власного search_path. Вона не змінює EXECUTE grants та не послаблює нові функції з порожнім path. Міграцію перевірено PGlite-тестами, включно з caller-schema/temp-table shadowing та повторним застосуванням; production deployment і перевірка реальних функцій ще потрібні.

Обраний порядок trusted schema / pg_temp відповідає [PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY). Саме закріплення search_path не замінює перевірок прав усередині функції.
