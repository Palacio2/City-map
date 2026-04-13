export type DistrictFieldType = 'number' | 'price' | 'boolean' | 'text' | 'crimeLevel' | 'rating_10';

export interface DistrictField {
  key: string;
  dbKey: string;
  type: DistrictFieldType;
  isPremiumField?: boolean;
  isRealtorOnly?: boolean;
  icon?: string;
}

export interface DistrictCategory {
  key: string;
  labelKey: string;
  icon: string;
  isPremium: boolean;
  ratingDbKey: string;
  fields: DistrictField[];
}

export type DynamicDistrictConfig = Record<string, DistrictCategory>;