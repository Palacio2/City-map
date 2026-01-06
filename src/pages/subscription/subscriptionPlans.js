import { FaStar, FaGem, FaBriefcase, FaCalendarWeek } from 'react-icons/fa';

export const subscriptionPlans = {
  free: {
    icon: FaStar,
    features: ['basic_map', 'limited_filters', 'limited_data_show'],
    disabledFeatures: ['full_data_access', 'all_filters', 'personal_stats_access', 'save_favorites', 'compare_districts', 'export_data'],
  },
  weekly: {
    icon: FaCalendarWeek,
    features: ['basic_map', 'full_data_access', 'all_filters', 'personal_stats_access', 'save_favorites', 'compare_districts'],
  },
  premium: {
    icon: FaGem,
    features: ['basic_map', 'full_data_access', 'all_filters', 'personal_stats_access', 'save_favorites', 'compare_districts'],
  },
  realtor: {
    icon: FaBriefcase,
    features: ['basic_map', 'full_data_access', 'all_filters', 'personal_stats_access', 'save_favorites', 'compare_districts', 'export_data', 'priority_support'],
  },
};