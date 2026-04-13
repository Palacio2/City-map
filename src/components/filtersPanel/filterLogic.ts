import { DistrictField, DynamicDistrictConfig } from '@config/districtFields';
import { TransformedDistrict, TransformedCategory } from '@utils/dataTransformers';

type CrimeScoreCategory = 'low' | 'medium' | 'high';
export type FilterValue = string | number | boolean | null | undefined;

const mapCrimeScoreToCategory = (score: FilterValue): CrimeScoreCategory | null => {
  if (score === null || score === undefined) return null;
  const num = parseFloat(String(score));
  if (Number.isNaN(num)) return null;
  return num < 4 ? 'low' : num < 7 ? 'medium' : 'high';
};

export const isFilterActive = (value: FilterValue): boolean => {
  return value !== undefined && value !== null && value !== '' && value !== 'any';
}

const validateField = (field: DistrictField, filterVal: FilterValue, districtVal: unknown): boolean => {
  if (!isFilterActive(filterVal)) return true;

  if (filterVal === true) {
    if (typeof districtVal === 'number') return districtVal > 0;
    return !!districtVal;
  }

  if (field.type === 'crimeLevel') {
    return mapCrimeScoreToCategory(districtVal as FilterValue) === filterVal;
  }

  if (field.type === 'text') {
    return String(districtVal).toLowerCase() === String(filterVal).toLowerCase();
  }

  const nFilter = parseFloat(String(filterVal));
  const nDistrict = parseFloat(String(districtVal)) || 0;
  
  if (Number.isNaN(nFilter)) return true;

  // Динамічно визначаємо, чи це ліміт "Максимум" (напр. ціна, дистанція) чи "Мінімум"
  const isMaxLimit = field.type === 'price' || field.key.toLowerCase().includes('distance');
  return isMaxLimit ? (nDistrict > 0 && nDistrict <= nFilter) : (nDistrict >= nFilter);
};

export type Filters = Record<string, Record<string, FilterValue>>;

export const filterDistrictsByCriteria = (
  districtsList: TransformedDistrict[], 
  filters: Filters,
  config: DynamicDistrictConfig | null
): TransformedDistrict[] => {
  if (!filters || Object.keys(filters).length === 0 || !config) {
    return districtsList;
  }

  return districtsList.filter(district => {
    const data = district.filterData;
    if (!data) return false;

    return Object.values(config).every(category => {
      const filterGroup = filters[category.key];
      if (!filterGroup) return true;
      
      const dataCategory = data[category.key] as TransformedCategory;
      if (!dataCategory) return true;

      return category.fields.every(field => {
        const filterVal = filterGroup[field.key];
        const districtVal = dataCategory.fields?.[field.key]?.value;
        return validateField(field, filterVal, districtVal);
      });
    });
  });
};