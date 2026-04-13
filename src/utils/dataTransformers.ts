import { DistrictFieldType, DynamicDistrictConfig } from '@config/districtFields';
import { UserAccess, getVisibleConfig } from './accessPolicy';

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

const safeParseFloat = (value: unknown): number | null => 
  (value !== null && value !== undefined) && !Number.isNaN(Number.parseFloat(String(value))) ? Number.parseFloat(String(value)) : null;

const safeParseInt = (value: unknown): number | null => 
  (value !== null && value !== undefined) && !Number.isNaN(Number.parseInt(String(value))) ? Number.parseInt(String(value)) : null;

const PARSERS: Record<string, (v: unknown) => FieldValue> = {
  number: safeParseInt,
  price: safeParseFloat,
  crimeLevel: safeParseFloat,
  rating_10: safeParseFloat,
  boolean: (v: unknown): FieldValue => {
    if (v === null || v === undefined) return null;
    if (v === true || v === false) return v;
    if (v === 'true') return true;
    if (v === 'false') return false;
    const num = Number(v);
    if (!Number.isNaN(num)) return num;
    return Boolean(v);
  },
  text: (v: unknown) => (typeof v === 'string' ? v : String(v || '') || null),
};

export const transformDistrictForDisplay = (
  district: DistrictData | null, 
  rawConfig: DynamicDistrictConfig | null,
  access: UserAccess
): TransformedDistrict | null => {
  const allowedConfig = getVisibleConfig(rawConfig, access);
  
  if (!district || !allowedConfig) return null;

  let rawData: Record<string, unknown> | null = null;
  if (Array.isArray(district.filterData)) rawData = district.filterData[0] as Record<string, unknown>;
  else if (district.filterData && typeof district.filterData === 'object') rawData = district.filterData as Record<string, unknown>;
  else if (district.district_data) rawData = Array.isArray(district.district_data) ? district.district_data[0] as Record<string, unknown> : district.district_data as Record<string, unknown>;
  else if (district.population !== undefined || district.average_salary !== undefined) rawData = district as Record<string, unknown>;

  const filterData = rawData || {};

  const transformedFilterData: TransformedFilterData = {
    general: {
      propertyPrice: safeParseFloat(filterData.average_sale_price_sqm),
      populationDensity: safeParseInt(filterData.population_density),
      greenSpaces: safeParseFloat(filterData.green_spaces_percent),
      population: safeParseInt(filterData.population),
      averageSalary: safeParseFloat(filterData.average_salary),
      unemploymentRate: safeParseFloat(filterData.unemployment_rate),
      average_rent_price: safeParseFloat(filterData.average_rent_price),
    }
  };

  Object.values(allowedConfig).forEach(category => {
    const transformedCategory: TransformedCategory = {
      key: category.key,
      rating: safeParseFloat(filterData[category.ratingDbKey]) || 0,
      icon: category.icon || '📌',
      fields: {}
    };

    category.fields.forEach(field => {
      const rawValue = filterData[field.dbKey];
      const parser = PARSERS[field.type] || ((v: unknown) => v as FieldValue);
      
      transformedCategory.fields[field.key] = {
        key: field.key,
        value: parser(rawValue),
        type: field.type
      };
    });

    transformedFilterData[category.key] = transformedCategory;
  });

  return {
    ...district,
    updated_at: (filterData.data_updated_at as string) || (filterData.last_updated as string) || district.updated_at || null,
    filterData: transformedFilterData
  };
};

export const transformDistrictsForDisplay = (
  districts: DistrictData[], 
  config: DynamicDistrictConfig | null,
  access: UserAccess
): TransformedDistrict[] => {
  if (!Array.isArray(districts) || !config) return [];
  return districts
    .map(d => transformDistrictForDisplay(d, config, access))
    .filter((d): d is TransformedDistrict => d !== null);
};

export const getFlatFilterData = (district: TransformedDistrict | null): TransformedFilterData | null => district?.filterData ?? null;