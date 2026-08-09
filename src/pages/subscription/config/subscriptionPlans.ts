import { FaStar, FaGem, FaBriefcase, FaCalendarWeek } from 'react-icons/fa';
import type { PlanConfig } from '../types';

export const subscriptionPlans: Record<string, PlanConfig> = {
  free: {
    name: 'free',
    icon: FaStar,
    features: ['district_limit_5', 'filters_limit_2', 'basic_rating'],
    disabledFeatures: ['safety_edu_analytics', 'financial_stats', 'favorites_save', 'compare_tools', 'pdf_export'],
  },
  weekly: {
    name: 'weekly',
    icon: FaCalendarWeek,
    features: ['unlimited_districts', 'extended_filters', 'partial_analytics', 'personal_stats', 'save_favorites', 'pdf_download'],
    disabledFeatures: [],
  },
  premium: {
    name: 'premium',
    icon: FaGem,
    features: ['all_weekly_features'],
    disabledFeatures: [],
  },
  realtor: {
    name: 'realtor',
    icon: FaBriefcase,
    features: [
      'all_premium_features', 'roi_calculator', 'white_label_pdf', 'compare_4_districts',
      'full_filter_access', 'full_district_info', 'popular_districts_monitor', 'growth_tracking'
    ],
    disabledFeatures: [],
  },
};