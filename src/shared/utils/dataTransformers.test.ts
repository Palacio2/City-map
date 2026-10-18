import { describe, it, expect } from 'vitest';
import { transformDistrictsForDisplay } from './dataTransformers';
import type { DynamicDistrictConfig } from '@config/districtFields';

describe('release regression: dynamic categories and numeric precision', () => {
  it('preserves summary values and the general category together', () => {
    const config: DynamicDistrictConfig = { general: { key: 'general', labelKey: 'general', icon: '', isPremium: false, ratingDbKey: 'general_rating', fields: [
      {key:'population',dbKey:'population',type:'number'},
      {key:'population_density',dbKey:'population_density',type:'number'},
    ] } };
    const [district] = transformDistrictsForDisplay([{filterData:{population:1000,population_density:3.9}}],config,{isFree:false,isRealtor:true});
    expect(district.filterData.general.population).toBe(1000);
    expect(district.filterData.general.populationDensity).toBe(3.9);
    expect(district.filterData.general).toHaveProperty('fields.population_density.value',3.9);
  });
});
