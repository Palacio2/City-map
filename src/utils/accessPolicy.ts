import { DynamicDistrictConfig } from '@config/districtFields';

export interface UserAccess {
  isFree: boolean;
  isRealtor: boolean;
}

export const getVisibleConfig = (
  config: DynamicDistrictConfig | null, 
  access: UserAccess
): DynamicDistrictConfig | null => {
  if (!config) return null;

  const visibleConfig: DynamicDistrictConfig = {};

  Object.values(config).forEach(category => {
    if (access.isFree && category.isPremium) return;

    const visibleFields = category.fields.filter(field => {
      if (access.isFree && field.isPremiumField) return false;
      if (field.isRealtorOnly && !access.isRealtor) return false;
      return true;
    });

    if (visibleFields.length > 0) {
      visibleConfig[category.key] = {
        ...category,
        fields: visibleFields
      };
    }
  });

  return visibleConfig;
};