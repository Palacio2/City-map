import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MapTab from './MapTab';
import { useActionGuard } from '@admin/core/context/useActionGuard';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

const mockUseActionGuard = vi.fn();
vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: () => mockUseActionGuard()
}));

const mockUseMapTab = vi.fn();
vi.mock('@admin/features/map/useMapTab', () => ({
  useMapTab: () => mockUseMapTab()
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: ({ children }: any) => <div data-testid="geojson-layer">{children}</div>,
  Polygon: ({ children }: any) => <div data-testid="polygon-layer">{children}</div>,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn(), flyTo: vi.fn() })
}));

vi.mock('@admin/core/utils/mapHelpers', () => ({
  MapFitBounds: () => null,
  createEmojiIcon: vi.fn()
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: any) => <div data-testid="marker-cluster-group">{children}</div>
}));

vi.mock('@react-leaflet/core', () => ({
  useLeafletContext: () => ({}),
  createPathComponent: (fn: any) => fn,
  createLayerComponent: (fn: any) => fn
}));

describe('MapTab Access Control Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseLogic = {
    t: (key: string) => key,
    countries: ['Ukraine'],
    selectedCountry: 'Ukraine',
    setSelectedCountry: vi.fn(),
    cities: [{ id: '1', name: 'Kyiv' }],
    selectedCity: '1',
    setSelectedCity: vi.fn(),
    geoData: { type: 'FeatureCollection', features: [] },
    mapCenter: [50.45, 30.52],
    mapZoom: 10,
    loadingMap: false,
    mapData: [{
      id: '1',
      name: 'Test Dist',
      geojson: {},
      fillColor: '#000',
      poi_data: []
    }],
    activeLayer: 'polygons',
    getLabelForKey: (k: string) => k
  };

  it('should render map and controls for super admin', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: () => true
    });
    mockUseMapTab.mockReturnValue(baseLogic);

    render(<MapTab />);

    // Map should be visible
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
    // Country select should be visible (showing selected country)
    expect(screen.getByText('Ukraine')).toBeInTheDocument();
    
    // City select should be visible (showing selected city)
    expect(screen.getByText('Kyiv')).toBeInTheDocument();
  });

  it('should handle empty cities and countries lists correctly (restricted access)', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: () => false // Let's say they have map access but no assigned cities
    });
    mockUseMapTab.mockReturnValue({
        ...baseLogic,
        countries: [],
        cities: [],
        selectedCountry: '',
        selectedCity: ''
    });

    render(<MapTab />);

    // Select options should still render but with only placeholder options
    expect(screen.getByText('admin_map.tab.country')).toBeInTheDocument();
    expect(screen.getByText('admin_map.tab.city')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: () => true
    });
    mockUseMapTab.mockReturnValue({
      ...baseLogic,
      loadingMap: true
    });

    render(<MapTab />);
    expect(screen.getByText('admin_map.tab.loading')).toBeInTheDocument();
  });
});
