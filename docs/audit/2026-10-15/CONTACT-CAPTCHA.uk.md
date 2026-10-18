# Увімкнення захисту звернень

> Актуальний стан застосування міграцій і Edge на 18.10: [DATABASE-ROLLOUT.uk.md](../../DATABASE-ROLLOUT.uk.md). Наведені нижче початкові локальні перевірки не замінюють цей стан.

Інтеграція Turnstile підготовлена локально. Widget/ключі для домену ще не налаштовані; production не змінювався. Без ключів нова версія форми та Edge відмовляє в надсиланні, тому не розгортати її окремо від конфігурації.

## Конфігурація

- Frontend build: `VITE_CONTACT_TURNSTILE_SITE_KEY` — публічний site key.
- Edge secret: `CONTACT_TURNSTILE_SECRET_KEY` — лише серверний secret, ніколи не VITE-змінна і не файл репозиторію.
- Edge: `CONTACT_TURNSTILE_HOSTNAMES` — точні дозволені hostname через кому, без протоколу, wildcard і шляхів. У production не додавати localhost або довільні preview-домени.
- Widget має бути дозволений для тих самих доменів. Action клієнта і сервера — `contact`.
- Якщо хостинг встановлює CSP, дозволити `https://challenges.cloudflare.com` у `script-src` та `frame-src`. Локальний vercel.json не встановлює CSP; перевірити фактичні заголовки хостингу.

Спершу конфігурація та перевірка у staging, потім узгоджений deploy Edge і frontend. Старий frontend не передає токен і буде відхилений новим Edge. Старий Edge не перевіряє CAPTCHA, навіть якщо новий widget уже показується.

## Контракт

Публічний contact-запит завжди потребує `captcha_token`, включно із запитом авторизованого користувача. Будь-який анонімний feedback також потребує токен: зміна поля type не обходить перевірку. Внутрішній feedback-widget доступний лише перевіреному Auth-користувачу і зберігає окрему durable user/email/global quota; CAPTCHA для цього авторизованого потоку не додається.

Siteverify викликається до quota/insert; сервер перевіряє success, exact hostname та action. Відсутні ключі, timeout, HTTP/JSON error не допускають запису. Secret і token не журналюються. Заголовки X-Forwarded-For не приймаються за довірену адресу клієнта. Ліміт токена — 2048 символів, timeout запиту — 8 секунд. Повторне використання відхиляє провайдер; форма скидає токен після кожної спроби. Загальні квоти залишаються додатковим захистом.

## Обов'язкова staging-перевірка

1. Реальний widget на дозволеному домені, успішне надсилання та запис у contacts_messages.
2. Expiry, повтор токена, відсутній токен, чужий hostname/action — жодного запису і витраченої quota.
3. Блокування script/iframe, недоступність Siteverify та відсутні ключі — зрозумілий generic error, форма зберігає введений текст.
4. Повтор після помилки отримує новий token; unmount прибирає widget, запізнілий callback не змінює форму.
5. Авторизований feedback проходить quota; підроблений user_id або type не обходить Auth/CAPTCHA.

Локальні тести використовують mocks. Вони не підтверджують працездатність домену/ключів, accessibility реального challenge або захист від масової реєстрації облікових записів. F18 залишається частково відкритим до конфігурації та staging/load перевірки.

Джерела: [серверна перевірка Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [вбудовування widget](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/).
