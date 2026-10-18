import { ReactNode, ElementType } from 'react';


export interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: ElementType;
  children: ReactNode;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

export interface StatsOverviewProps {
  stats: DashboardStats | null;
  weeklyActivity: WeeklyActivityData[];
  trackedDistricts: TrackedDistrict[];
}

export interface TrackedDistrictPayload {
  country: string;
  city: string;
  district: string;
  districtId: string;
}
export interface TrackedDistrict {
  id: string;
  country: string;
  city: string;
  district: string;
  district_id?: string | null;
  rental_price?: number;
  avg_price_rent?: number;
  sale_price?: number;
  avg_price_sqm?: number;
  updated_at?: string | null;
  created_at?: string | null;
}
export interface FavoriteDistrictData {
  name?: string;
  district?: string;
  city?: string;
  country?: string;
}

export interface WeeklyActivityData {
  date: string;
  searches: number;
  comparisons?: number;
  dayLabel?: string;
}
export interface DashboardStats {
  lastActive: string | null;
  favoriteDistrict?: FavoriteDistrictData;
  viewedDistricts: number;
  savedDistricts: number;
  comparisons: number;
  totalTime: number;
}
