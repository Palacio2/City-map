import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DistrictsManager from './DistrictsManager';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  })
}));

vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: vi.fn()
}));

vi.mock('@admin/core/ui/Button', () => ({
  Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>
}));

vi.mock('@admin/core/ui/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => <input data-testid="search-input" value={value} onChange={onChange} placeholder={placeholder} />
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
  });

  it('should render scan OSM button when having parser.scan_osm permission', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: (action: string) => action === 'parser.scan_osm'
    });

    render(<DistrictsManager {...mockProps} />);
    expect(screen.getByText(/admin_parser.districts.scan_osm/i)).toBeInTheDocument();
  });

  it('should not render scan OSM button when missing parser.scan_osm permission', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager {...mockProps} />);
    expect(screen.queryByText(/admin_parser.districts.scan_osm/i)).not.toBeInTheDocument();
  });

  it('should render import geojson button when having parser.import_geojson permission', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: (action: string) => action === 'parser.import_geojson'
    });

    render(<DistrictsManager {...mockProps} />);
    expect(screen.getByText(/admin_parser.districts.import_geojson/i)).toBeInTheDocument();
  });

  it('should not render import geojson button when missing parser.import_geojson permission', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager {...mockProps} />);
    expect(screen.queryByText(/admin_parser.districts.import_geojson/i)).not.toBeInTheDocument();
  });

  it('should render create districts button in found list when having parser.create_districts', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: (action: string) => action === 'parser.create_districts'
    });

    render(<DistrictsManager {...mockProps} />);
    const buttons = screen.getAllByTitle('admin_parser.districts.add_to_db');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not render create districts button when missing parser.create_districts', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager {...mockProps} />);
    expect(screen.queryByTitle('admin_parser.districts.add_to_db')).not.toBeInTheDocument();
  });

  it('should render delete permanent button in DB list when having parser.delete_districts', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: (action: string) => action === 'parser.delete_districts'
    });

    render(<DistrictsManager {...mockProps} />);
    const buttons = screen.getAllByTitle('admin_parser.districts.delete_permanent');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not render delete permanent button when missing parser.delete_districts', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: () => false
    });

    render(<DistrictsManager {...mockProps} />);
    expect(screen.queryByTitle('admin_parser.districts.delete_permanent')).not.toBeInTheDocument();
  });
});
