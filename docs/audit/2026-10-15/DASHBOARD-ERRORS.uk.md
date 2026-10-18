# Помилки завантаження статистики

> Актуальний стан застосування міграцій і Edge на 18.10: [DATABASE-ROLLOUT.uk.md](../../DATABASE-ROLLOUT.uk.md). Наведені нижче початкові локальні перевірки не замінюють цей стан.

Виявлено: fetchDashboardData і get-dashboard-stats повертали успішний результат із порожніми даними при помилках БД. Це маскувало недоступність сервісу під відсутність активності. Edge endpoint також читав відсутню колонку search_count.

Frontend тепер відхиляє весь запит, якщо не вдалося отримати хоча б одне з чотирьох джерел: user_stats, weekly activity, popular districts, tracked districts. Наявний useStatsData отримує query error. Успішний maybeSingle з data=null для нового користувача лишається валідним порожнім результатом.

Сумісний Edge endpoint перевіряє всі три свої джерела, повертає 503 при збої, 401 для відсутньої/невалідної авторизації та 405 для непідтриманого методу. GET, POST і OPTIONS збережено. Відповіді приватні, no-store, без тексту внутрішніх помилок БД. Legacy поле searches відображає viewed_districts_count: чинний track_district_visit одночасно збільшує перегляди й денний searches_count. Це не нова метрика виконаних текстових пошуків.

Додано 6 frontend і 4 handler regression tests. Перевірено окремі збої кожного джерела, новий акаунт без статистики, прив’язку до поточного користувача, статуси авторизації, дозволені методи та відсутність витоку помилок. Міграція БД не потрібна. Для production потрібні deployment frontend і redeploy get-dashboard-stats; у цьому продовженні вони не виконувались.

Повний прогін: npm run check — 210 frontend / 312 security, lint, TypeScript, build успішні; npm run check:edge — 38/38, dependency audit успішний.
