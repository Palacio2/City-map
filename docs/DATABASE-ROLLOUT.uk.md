# Синхронізація БД — 18.10.2026

Користувач підтвердив: поточний City-map проєкт `puwcmmwlpxxcolwifexp` використовується як тестовий; окремої staging-БД немає, ризик втрати тестових даних прийнятний. Це дозволило виконати синхронізацію без відкладеного Docker/restore. Дані навмисно не видалялися, reset/repair не використовувалися.

## Виконано

- Застосовано всі **17** нових міграцій від `20261015150947_release_audit_hardening` до `20261018130836_limit_activity_events`. Тепер у remote history 30 міграцій.
- Повторний `supabase db push --linked --dry-run`: `upToDate: true`, порожній список міграцій.
- Розгорнуто **35 Edge Functions** через API без Docker, включно з photo/comments, audit, billing та retired endpoints; функції не видалялися через prune.
- TypeScript-контракти перегенеровано з актуальної public-схеми БД.
- Виправлено deployment-помилку: legacy-only Supabase проєкт отримує порожній словник нових ключів. Resolver використовує legacy key тільки за порожнього словника; неправильний непорожній словник, невалідний JSON і неправильний direct key залишаються помилками. [Формат ключів Supabase](https://supabase.com/docs/guides/functions/secrets).
- Read-only deployed smoke: **14 passed, 0 failed, 1 skipped**. Перевірено retired endpoints, відмову анонімному доступу, public filters. Пропущено перевірку конкретного attachment URL: тестовий шлях не задано.

## Межі та залишок

Frontend і Node parser backend підготовлено в Git; їхні віддалені deployment не виконувалися цією командою. Старі browser bundles з прямими photo/RPC URL потребують оновлення. Повноцінні authenticated/browser/payment/worker/concurrency сценарії ще потрібні. Реальних Stripe mutations під час синхронізації не виконувалось.

CAPTCHA ключі відсутні: анонімна форма звернень лишається fail-closed до [налаштування провайдера](audit/2026-10-15/CONTACT-CAPTCHA.uk.md). Оновлення PostgreSQL F08 та restore/baseline F06 не закриті. Docker-попередження CLI стосувалося локального кешування catalog після успішних міграцій, не відкату міграцій.

Security advisors після deployment ще вказують на PostgreSQL patches, leaked-password protection і pg_trgm у public. Повідомлення про RLS без policies на приватних службових таблицях та навмисні definer RPC слід оцінювати за grants/авторизацією; не відкривати таблиці заради зникнення INFO.

Поточні локальні логи — ігнорована директорія `logs/`; їх не комітити. Перед наступним релізом повторити перевірки, а не покладатися на старі логи.
