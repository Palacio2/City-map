import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import DistrictsManager from './DistrictsManager';
const mockUseParserContext = vi.hoisted(() => vi.fn());
vi.mock('./ParserContext', () => ({ useParserContext: mockUseParserContext }));
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  })
}));

vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: vi.fn()
}));

vi.mock('@admin/core/ui/Button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled?: boolean }) => <button onClick={onClick} disabled={disabled}>{children}</button>
}));

vi.mock('@admin/core/ui/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: { value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) => <input data-testid="search-input" value={value} onChange={onChange} placeholder={placeholder} />
}));

import { useActionGuard } from '@admin/core/context/useActionGuard';

describe('DistrictsManager Access Control', () => {
  const mockProps = {
    foundDistricts: [{ id: '1', name: 'Found District' }],
    dbDistricts: [{ id: '2', name: 'DB District' }],
    selectedIds: [],
    onToggleSelect: vi.fn(),
    onSelectAll: vi.fn(),
    onScan: vi.fn(),
    onCreate: vi.fn(),
    onRemoveFromFound: vi.fn(),
    onDeleteDbDistrict: vi.fn(),
    onImportGeoJson: vi.fn(),
    loading: false,
    isSuperAdmin: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParserContext.mockReturnValue({
      logic: { foundDistrictsOSM: mockProps.foundDistricts, dbDistricts: mockProps.dbDistricts, loading: false,
        scanOSM: mockProps.onScan, createDistrictsInDb: mockProps.onCreate, setFoundDistrictsOSM: mockProps.onRemoveFromFound,
        deleteDbDistrict: mockProps.onDeleteDbDistrict, importBoundariesGeoJSON: mockProps.onImportGeoJson },
      selectedDistrictIds: [], toggleDistrictSelection: mockProps.onToggleSelect, toggleSelectAll: mockProps.onSelectAll,
      city: { id: 'city', name: 'City' }
    });
  });

  it('should render scan OSM button when having parser.scan_osm permission', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: (action: string) => action === 'parser.scan_osm'
    });

    render(<DistrictsManager />);
    expect(screen.getByText(/admin_parser.districts.scan_osm/i)).toBeInTheDocument();
  });

  it('should not render scan OSM button when missing parser.scan_osm permission', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager />);
    expect(screen.queryByText(/admin_parser.districts.scan_osm/i)).not.toBeInTheDocument();
  });

  it('should render import geojson button when having parser.import_geojson permission', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: (action: string) => action === 'parser.import_geojson'
    });

    render(<DistrictsManager />);
    expect(screen.getByText(/admin_parser.districts.import_geojson/i)).toBeInTheDocument();
  });

  it('should not render import geojson button when missing parser.import_geojson permission', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager />);
    expect(screen.queryByText(/admin_parser.districts.import_geojson/i)).not.toBeInTheDocument();
  });

  it('should render create districts button in found list when having parser.create_districts', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: (action: string) => action === 'parser.create_districts'
    });

    render(<DistrictsManager />);
    const buttons = screen.getAllByTitle('admin_parser.districts.add_to_db');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not render create districts button when missing parser.create_districts', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager />);
    expect(screen.queryByTitle('admin_parser.districts.add_to_db')).not.toBeInTheDocument();
  });

  it('should render delete permanent button in DB list when having parser.delete_districts', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: (action: string) => action === 'parser.delete_districts'
    });

    render(<DistrictsManager />);
    const buttons = screen.getAllByTitle('admin_parser.districts.delete_permanent');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not render delete permanent button when missing parser.delete_districts', () => {
    (useActionGuard as Mock).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager />);
    expect(screen.queryByTitle('admin_parser.districts.delete_permanent')).not.toBeInTheDocument();
  });
});
