import { mapTrackedDistrict } from '../functions/get-tracked-districts/mapper.ts';

const row = { id: 'tracked', country: 'PL', city: 'city', district: 'district', district_id: 'id', created_at: '2026-01-01' };
const stats = { average_rent_price: 1200, average_sale_price_sqm: 9000 };
for (const arrayDistrict of [false, true]) {
  for (const arrayStats of [false, true]) {
    Deno.test(`tracked relation district array=${arrayDistrict}, stats array=${arrayStats}`, () => {
      const district = { updated_at: '2026-10-10', district_filter_data: arrayStats ? [stats] : stats };
      const result = mapTrackedDistrict({ ...row, districts: arrayDistrict ? [district] : district });
      if (result.rental_price !== 1200 || result.sale_price !== 9000 || result.updated_at !== '2026-10-10') {
        throw new Error('Nested relation data lost');
      }
    });
  }
}
for (const districts of [null, [], { district_filter_data: null }, { district_filter_data: [] }]) {
  Deno.test(`missing district data ${JSON.stringify(districts)}`, () => {
    const result = mapTrackedDistrict({ ...row, districts });
    if (result.rental_price !== undefined || result.sale_price !== undefined || result.updated_at !== row.created_at) {
      throw new Error('Missing relation fallback failed');
    }
  });
}
