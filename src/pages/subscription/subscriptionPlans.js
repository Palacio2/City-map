import { FaStar, FaCrown, FaGem } from 'react-icons/fa';

export const subscriptionPlans = {
  free: {
    name: 'Безкоштовний',
    price: '0 грн',
    icon: FaStar,
    features: [
      'basic_map', 'limited_filters', 'parks_filter', 'cafes_filter',
      'education_basic', 'medicine_basic', 'transport_basic'
    ],
    disabledFeatures: [
      'all_filters', 'real_estate_detailed', 'ratings', 'safety_analysis',
      'transport_realtime', 'utilities_prices', 'save_favorites', 'compare_districts'
    ],
  },
  pro: {
    name: 'Pro',
    price: '149 грн/міс',
    icon: FaCrown,
    features: [
      'all_filters', 'real_estate_detailed', 'ratings', 'safety_analysis',
      'transport_realtime', 'utilities_prices', 'save_favorites', 'compare_districts'
    ],
  },
  premium: {
    name: 'Premium',
    price: '299 грн/міс',
    icon: FaGem,
    features: [
      'all_filters', 'real_estate_detailed', 'ratings', 'safety_analysis',
      'transport_realtime', 'utilities_prices', 'save_favorites', 'compare_districts'
    ],
  },
};

export const featureTranslations = {
  'basic_map': 'Базова карта району',
  'limited_filters': 'Обмежені фільтри',
  'parks_filter': 'Фільтр парків',
  'cafes_filter': 'Фільтр кафе',
  'education_basic': 'Базова освітня інформація',
  'medicine_basic': 'Базова медична інформація',
  'transport_basic': 'Базова транспортна інформація',
  'all_filters': 'Повний доступ до всіх фільтрів',
  'real_estate_detailed': 'Детальна інформація про нерухомість',
  'ratings': 'Рейтинги закладів',
  'safety_analysis': 'Аналіз безпеки району',
  'transport_realtime': 'Транспортна доступність в реальному часі',
  'utilities_prices': 'Комунальні послуги та ціни',
  'save_favorites': 'Збереження улюблених районів',
  'compare_districts': 'Порівняння районів',
};

export const hasFeatureForPlan = (planKey, featureKey) => 
  subscriptionPlans[planKey]?.features.includes(featureKey);