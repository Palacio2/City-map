import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ManualSidebar from './ManualSidebar';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

const mockUseAdmin = vi.fn();
vi.mock('@admin/core/context/AdminContext', () => ({
  useAdmin: () => mockUseAdmin()
}));

const mockUseModals = vi.fn();
vi.mock('@admin/core/context/ModalContext', () => ({
  useModals: () => mockUseModals()
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'countries') return { data: [{ id: '1', name: 'Ukraine' }] };
    if (queryKey[0] === 'cities') return { data: [{ id: '1', name: 'Kyiv' }] };
    if (queryKey[0] === 'districts') return { data: [{ id: '1', name: 'Obolon' }] };
    return { data: [] };
  },
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

vi.mock('@admin/core/ui/EntityModal', () => ({
  default: () => <div data-testid="entity-modal" />
}));

vi.mock('./CityMapModal', () => ({
  default: () => <div data-testid="city-map-modal" />
}));

vi.mock('@admin/core/ui/SearchInput', () => ({
  SearchInput: () => <input data-testid="search-input" />
}));

describe('ManualSidebar Access Control Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseModals.mockReturnValue({ showAlert: vi.fn(), showConfirm: vi.fn() });
  });

  const baseProps = {
    selectedCountry: { id: '1', name: 'Ukraine' },
    setSelectedCountry: vi.fn(),
    selectedCity: { id: '1', name: 'Kyiv' },
    setSelectedCity: vi.fn(),
    selectedDistrict: { id: '1', name: 'Obolon' },
    setSelectedDistrict: vi.fn()
  };

  it('should render all add buttons for super admin', () => {
    mockUseAdmin.mockReturnValue({
      currentAdmin: { role: 'super_admin' }
    });

    render(<ManualSidebar {...baseProps} />);

    // Since we are mocking the query, we should see the lists.
    // The "Add" buttons will have title "common.add" which comes from translation mock
    const addButtons = screen.getAllByTitle('common.add');
    // Country, City, District -> 3 lists means 3 add buttons
    expect(addButtons.length).toBe(3);
  });

  it('should NOT render any add buttons for admin without permissions', () => {
    mockUseAdmin.mockReturnValue({
      currentAdmin: { role: 'admin', allowed_tabs: [], cities: ['1'] }
    });

    render(<ManualSidebar {...baseProps} />);

    const addButtons = screen.queryAllByTitle('common.add');
    expect(addButtons.length).toBe(0);
  });

  it('should render specific add button if admin has the permission', () => {
    mockUseAdmin.mockReturnValue({
      currentAdmin: { role: 'admin', allowed_tabs: ['manual.create.city'], cities: ['1'] }
    });

    render(<ManualSidebar {...baseProps} />);

    // Only one add button should be present (for cities)
    const addButtons = screen.queryAllByTitle('common.add');
    expect(addButtons.length).toBe(1);
  });
});
