import type { ReactNode } from 'react';
import { render, screen, act } from '@testing-library/react';
import { it, expect, vi, beforeEach } from 'vitest';
import CityMapModal from './CityMapModal';
import { adminGeoApi } from '@admin/core/api/adminGeoApi';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@admin/core/api/adminGeoApi', () => ({ adminGeoApi: { getMapData: vi.fn() } }));
vi.mock('@admin/core/hooks/useDynamicFields', () => ({ useDynamicFields: () => ({ fieldsConfig: [] }) }));
vi.mock('@admin/core/ui/BaseModal', () => ({ default: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) => isOpen ? <div>{children}</div> : null }));
vi.mock('@admin/core/utils/mapHelpers', () => ({ parseAndFixGeoJSON: (v: unknown) => v, assignColorsToFeatures: (v: unknown) => v }));
vi.mock('@admin/core/ui/LeafletGeoViewer', () => ({ LeafletGeoViewer: ({ mapData }: { mapData: { name: string }[] }) => <div data-testid="map-data">{mapData.map(d => d.name).join(',')}</div> }));
const deferred = () => {
  let resolve!: (data: { data: { name: string }[] }) => void;
  const promise = new Promise<{ data: { name: string }[] }>(done => { resolve = done; });
  return { promise, resolve };
};
beforeEach(() => { vi.clearAllMocks(); });

it('keeps the newest city when older request finishes later', async () => {
  const first = deferred(), second = deferred();
  vi.mocked(adminGeoApi.getMapData).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { rerender } = render(<CityMapModal isOpen onClose={vi.fn()} city={{ id: 'a', name: 'A' }} />);
  rerender(<CityMapModal isOpen onClose={vi.fn()} city={{ id: 'b', name: 'B' }} />);
  await act(async () => { second.resolve({ data: [{ name: 'Newest' }] }); });
  expect(screen.getByTestId('map-data')).toHaveTextContent('Newest');
  await act(async () => { first.resolve({ data: [{ name: 'Stale' }] }); });
  expect(screen.getByTestId('map-data')).toHaveTextContent('Newest');
  expect(screen.queryByText('Stale')).not.toBeInTheDocument();
});

it('does not reuse a pending response after closing and reopening', async () => {
  const old = deferred(), current = deferred();
  vi.mocked(adminGeoApi.getMapData).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const city = { id: 'a', name: 'A' }, onClose = vi.fn();
  const { rerender } = render(<CityMapModal isOpen onClose={onClose} city={city} />);
  rerender(<CityMapModal isOpen={false} onClose={onClose} city={city} />);
  await act(async () => { old.resolve({ data: [{ name: 'Stale' }] }); });
  rerender(<CityMapModal isOpen onClose={onClose} city={city} />);
  expect(screen.queryByText('Stale')).not.toBeInTheDocument();
  await act(async () => { current.resolve({ data: [{ name: 'Fresh' }] }); });
  expect(screen.getByTestId('map-data')).toHaveTextContent('Fresh');
});
