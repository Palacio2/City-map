import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useGeoMapData } from './useGeoMapData';

const fixture = vi.hoisted(() => ({
  config: { services: { fields: [{ dbKey: 'schools_count', isPremiumField: false }] } },
  get: vi.fn(),
}));
vi.mock('@subscription/context/SubscriptionContext', () => ({ useSubscription: () => ({ isFree: true, isRealtor: false }) }));
vi.mock('@hooks/useFiltersConfig', () => ({ useFiltersConfig: () => ({ config: fixture.config }) }));
vi.mock('../api/geoApi', () => ({ geoApi: { getDistrictGeoData: fixture.get } }));

beforeEach(() => {
  fixture.config = { services: { fields: [{ dbKey: 'schools_count', isPremiumField: false }] } };
  fixture.get.mockReset().mockResolvedValue({ geojson: null, poi_data: [{ type: 'schools', coord: [52, 21] }] });
});
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { wrapper };
}
it('initializes visible filters on a cache-hit remount without refetching', async () => {
  const { wrapper } = setup();
  const first = renderHook(() => useGeoMapData('district', true), { wrapper });
  await waitFor(() => expect(first.result.current.filteredPois).toHaveLength(1));
  act(() => first.result.current.toggleAll());
  expect(first.result.current.filteredPois).toHaveLength(0);
  first.unmount();
  const second = renderHook(() => useGeoMapData('district', true), { wrapper });
  expect(second.result.current.activeFilters).toEqual(['schools']);
  expect(second.result.current.filteredPois).toHaveLength(1);
  expect(fixture.get).toHaveBeenCalledTimes(1);
  expect(fixture.get.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
});
it('reapplies changed field permissions to cached POIs immediately', async () => {
  const { wrapper } = setup();
  const { result, rerender } = renderHook(() => useGeoMapData('district', true), { wrapper });
  await waitFor(() => expect(result.current.filteredPois).toHaveLength(1));
  fixture.config = { services: { fields: [{ dbKey: 'schools_count', isPremiumField: true }] } };
  rerender();
  expect(result.current.geoData?.poi_data).toHaveLength(0);
  expect(result.current.activeFilters).toEqual([]);
  expect(fixture.get).toHaveBeenCalledTimes(1);
});
