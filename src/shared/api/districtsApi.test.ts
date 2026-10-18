import { beforeEach, expect, it, vi } from 'vitest';
import { fetchDistrictsByIds, fetchDistrictsWithFilters, fetchDistrictSearch } from './districtsApi';
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@supabaseClient', () => ({ supabase: { functions: { invoke } } }));
beforeEach(() => invoke.mockReset());

it('uses the Supabase transport for map loading and preserves cancellation', async () => {
  const signal = new AbortController().signal;
  invoke.mockResolvedValue({ data: [{ id: 'one' }], error: null });
  expect(await fetchDistrictsWithFilters('Poland', 'City', signal)).toEqual([{ id: 'one' }]);
  expect(invoke).toHaveBeenCalledWith('get-districts', {
    body: { country: 'Poland', city: 'City', filters: 'true' }, signal,
  });
});
it('uses the same transport for selected IDs and skips empty selections', async () => {
  expect(await fetchDistrictsByIds([])).toEqual([]);
  expect(invoke).not.toHaveBeenCalled();
  invoke.mockResolvedValue({ data: [], error: null });
  await fetchDistrictsByIds(['a', 'b']);
  expect(invoke).toHaveBeenCalledWith('get-districts', { body: { ids: 'a,b', filters: 'true' } });
});
it('does not turn transport failures into an empty map', async () => {
  invoke.mockResolvedValue({ data: null, error: new Error('unavailable') });
  await expect(fetchDistrictsWithFilters('Country', 'City')).rejects.toThrow('unavailable');
  await expect(fetchDistrictsByIds(['one'])).rejects.toThrow('unavailable');
});
it('sends actual search criteria to the server instead of filtering a truncated city locally',async()=>{
  invoke.mockResolvedValue({data:[],error:null});
  await fetchDistrictsWithFilters('Country','City',undefined,{schools_count:true});
  expect(invoke).toHaveBeenCalledWith('get-districts',{body:{country:'Country',city:'City',filters:'{"schools_count":true}'},signal:undefined});
});
it('retrieves exact search totals without requiring all district payloads',async()=>{
  const data={districts:[{id:'one'}],total:20,originalTotal:50};
  invoke.mockResolvedValue({data,error:null});
  expect(await fetchDistrictSearch('Country','City',{schools_count:true})).toEqual(data);
  expect(invoke).toHaveBeenCalledWith('get-districts',{body:{country:'Country',city:'City',filters:'{"schools_count":true}',includeTotals:true},signal:undefined});
  invoke.mockResolvedValue({data:[],error:null});
  await expect(fetchDistrictSearch('Country','City',{})).rejects.toThrow('Invalid search response');
});
