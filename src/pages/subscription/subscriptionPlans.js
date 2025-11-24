import { FaStar, FaGem } from 'react-icons/fa'; // Видалено FaCrown

export const subscriptionPlans = {
  // *** ОНОВЛЕНО: Тільки Безкоштовний та Premium ***
  free: {
    name: 'Безкоштовний',
    price: '0 грн',
    icon: FaStar,
    features: [
      'basic_map', // Базова інформація про райони
      'limited_filters', // Обмежена фільтрація даних
      'limited_data_show', // Обмежений показ даних (новий ключ)
    ],
    disabledFeatures: [
      'full_data_access', // Повний доступ до всіх даних (новий ключ)
      'all_filters', // Повний доступ до всіх фільтрів
      'personal_stats_access', // Доступ до статистики в особистому кабінеті (новий ключ)
      'save_favorites', // Функція збереження улюблених районів
      'compare_districts' // Порівняння районів
    ],
  },
  premium: {
    name: 'Premium',
    price: '299 грн/міс',
    icon: FaGem,
    features: [
      'basic_map', // Залишаємо базову функцію, як включену
      'full_data_access', // Повний доступ до всіх даних (новий ключ)
      'all_filters', // Повний доступ до всіх фільтрів
      'personal_stats_access', // Доступ до статистики в особистому кабінеті (новий ключ)
      'save_favorites', // Функція збереження улюблених районів
      'compare_districts' // Порівняння районів
    ],
  },
};

export const featureTranslations = {
  // *** ОНОВЛЕНО/ДОДАНО ПЕРЕКЛАДИ ***
  'basic_map': 'Базова інформація про райони',
  'limited_filters': 'Обмежена фільтрація даних',
  'limited_data_show': 'Обмежений показ даних',
  
  'full_data_access': 'Повний доступ до всіх даних',
  'all_filters': 'Повний доступ до всіх фільтрів',
  'personal_stats_access': 'Доступ до статистики в особистому кабінеті',
  'save_favorites': 'Функція збереження улюблених районів',
  'compare_districts': 'Порівняння районів',

  // Видалено старі детальні переклади, що не використовуються
  // 'parks_filter': 'Фільтр парків',
  // 'cafes_filter': 'Фільтр кафе',
  // 'education_basic': 'Базова освітня інформація',
  // 'medicine_basic': 'Базова медична інформація',
  // 'transport_basic': 'Базова транспортна інформація',
  // 'real_estate_detailed': 'Детальна інформація про нерухомість',
  // 'ratings': 'Рейтинги закладів',
  // 'safety_analysis': 'Аналіз безпеки району',
  // 'transport_realtime': 'Транспортна доступність в реальному часі',
  // 'utilities_prices': 'Комунальні послуги та ціни',
};

export const hasFeatureForPlan = (planKey, featureKey) => 
  subscriptionPlans[planKey]?.features.includes(featureKey);