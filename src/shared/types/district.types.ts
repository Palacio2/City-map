import type { DistrictFieldType } from '@config/districtFields';

export type FieldValue = string | number | boolean | null;

export interface GeneralStats {
  propertyPrice: number | null;
  populationDensity: number | null;
  greenSpaces: number | null;
  population: number | null;
  averageSalary: number | null;
  unemploymentRate: number | null;
  average_rent_price: number | null;
}

export interface TransformedFieldData {
  key: string;
  value: FieldValue;
  type: DistrictFieldType;
}

export interface TransformedCategory {
  key: string;
  rating: number;
  icon: string;
  fields: Record<string, TransformedFieldData>;
}

export type TransformedFilterData = {
  general: GeneralStats;
} & Record<string, TransformedCategory | GeneralStats>;

export interface DistrictData {
  id?: string | number;
  name?: string;
  city?: string;
  country?: string;
  photo_url?: string;
  updated_at?: string | null;
  filterData?: Record<string, unknown> | Record<string, unknown>[];
  district_data?: Record<string, unknown> | Record<string, unknown>[];
  population?: number;
  average_salary?: number;
  [key: string]: unknown;
}

export interface TransformedDistrict extends DistrictData {
  filterData: TransformedFilterData;
  updated_at: string | null;
}
