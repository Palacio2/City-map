# Залишкові RPC-шляхи — 18.10.2026

> Актуальний стан застосування міграцій і Edge на 18.10: [DATABASE-ROLLOUT.uk.md](../../DATABASE-ROLLOUT.uk.md). Наведені нижче початкові локальні перевірки не замінюють цей стан.

Read-only зіставлення production definitions із локальними викликами підтвердило два обходи: популярність не фільтрувала приховані райони/міста, а comments RPC лишався доступний напряму та використовував JWT app_metadata role для читання прихованих коментарів. Саме наявність нового Edge endpoint не закривала старий RPC.

Міграція `20261018035627_restrict_popularity_rpc_visibility.sql` підготовлена локально:

| Функція/категорія | Контракт після міграції |
|---|---|
| get_popular_district_ids(text,text) | Тільки service_role, SECURITY INVOKER. Обмеження країни/міста, лише доступні райони й міста, стабільні ties, до 100 ID. Це внутрішнє сортування get-districts, не новий клієнтський канал сирих даних. |
| get_popular_districts_stats() | authenticated/service_role; агрегат назв і кількості відстежень лише видимої географії, до 10 результатів. SECURITY DEFINER потрібний для агрегування приватних tracking rows; самі рядки та user IDs не повертаються. |
| get_district_comments_with_users(uuid) | Тільки service_role для get-district-comments Edge. Лише is_hidden=false, доступний район і місто. JWT admin-role не розширює відповідь. Дані аватарів проходять наявну Edge-валідацію/підписування. |
| public trigger functions | Відкликано прямий browser EXECUTE. Вже прикріплені тригери продовжують працювати; це перевірено звичайним INSERT під authenticated. |
| track_user_activity(text) | Невикористовуваний RPC закритий для public/anon/authenticated/service_role. Визначення посилається на відсутню user_stats.search_count; у чинному frontend/Edge викликів немає. |

Наявні шляхи модерації адміна не використовують public comments RPC, тому залишаються окремими permission/MFA-checked endpoints. get_total_users не змінено: його фактичний клієнт — інформаційна панель сторінки входу, тобто не можна механічно трактувати всі SECURITY DEFINER попередження як однакові помилки. Окремі auth/password/platform налаштування цим не закриваються.

Перед застосуванням міграції розгорнути/перевірити актуальні get-districts, get-district-comments та frontend коментарів. Старий клієнт із прямим comments RPC втратить доступ; це необхідне закриття обходу, а не сумісний alias. Права SELECT service_role на countries/cities/districts/user_district_visits у поточній БД підтверджено read-only.

PGlite regressions перевіряють країну/місто, приховану й NULL-видимість, порядок популярності, обмежений aggregate contract, browser/anonymous denial, роботу тригера після REVOKE та відсутність впливу stale admin JWT на moderated comments. Міграція повторно виконується без помилок. Реальне PostgREST/Edge smoke після deployment ще потрібне. Production не змінювався.
