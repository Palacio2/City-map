import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DashboardTab from './DashboardTab';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

const mockCanDo = vi.fn();
vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: () => ({
    canDo: mockCanDo,
    isSuperAdmin: false
  })
}));

const mockUseDashboard = vi.fn();
vi.mock('@admin/features/dashboard/useDashboard', () => ({
  useDashboard: () => mockUseDashboard()
}));

// Mock child components to simplify testing
vi.mock('@admin/core/ui/DataTable', () => ({
  default: ({ columns, emptyMessage }: { columns: { header: string }[], emptyMessage: string }) => (
    <div data-testid="data-table">
      {columns.map((col) => (
        <span key={col.header} data-testid={`col-${col.header}`}>{col.header}</span>
      ))}
      <div data-testid="empty-msg">{emptyMessage}</div>
    </div>
  )
}));

vi.mock('@admin/core/ui/MiniStatsChart', () => ({
  default: () => <div data-testid="mini-stats-chart" />
}));

vi.mock('@admin/core/ui/StatCard', () => ({
  StatCard: ({ title }: { title: string }) => <div data-testid={`stat-card-${title}`} />
}));

describe('DashboardTab Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseStats = {
    totalCountries: 1,
    totalCities: 1,
    totalDistricts: 1,
    publishedDistricts: 1,
    problematicDistricts: [{ id: '1', name: 'Dist 1' }],
    outdatedDistricts: [{ id: '2', name: 'Dist 2' }]
  };

  it('should render chart and edit buttons for users with manual.edit permission', () => {
    mockCanDo.mockImplementation((perm) => perm === 'manual.edit');
    mockUseDashboard.mockReturnValue({
      stats: baseStats,
      chartData: [{ label: 'Mon', value: 1 }],
      loading: false,
      isSuperAdmin: false
    });

    render(<DashboardTab />);

    // Chart should be visible (everyone sees analytics now)
    expect(screen.getByTestId('mini-stats-chart')).toBeInTheDocument();
    
    // Combined table should have edit column
    const editCols = screen.getAllByTestId('col-admin_dashboard.tab.col_edit');
    expect(editCols.length).toBe(1);
  });

  it('should render chart but no edit buttons for users without manual.edit permission', () => {
    mockCanDo.mockReturnValue(false);
    mockUseDashboard.mockReturnValue({
      stats: baseStats,
      chartData: [{ label: 'Mon', value: 1 }],
      loading: false,
      isSuperAdmin: false
    });

    render(<DashboardTab />);

    // Chart should be visible
    expect(screen.getByTestId('mini-stats-chart')).toBeInTheDocument();
    
    // No edit column
    const editCols = screen.queryAllByTestId('col-admin_dashboard.tab.col_edit');
    expect(editCols.length).toBe(0);
  });

  it('should render empty state dashboard correctly when no problems exist', () => {
    mockCanDo.mockReturnValue(true);
    mockUseDashboard.mockReturnValue({
      stats: {
        ...baseStats,
        problematicDistricts: [],
        outdatedDistricts: []
      },
      chartData: [],
      loading: false,
      isSuperAdmin: true
    });

    render(<DashboardTab />);

    // Chart should NOT be visible because data is empty
    expect(screen.queryByTestId('mini-stats-chart')).not.toBeInTheDocument();
    
    // Should see success messages for empty problems
    expect(screen.getByText('admin_dashboard.tab.all_fresh')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    mockCanDo.mockReturnValue(true);
    mockUseDashboard.mockReturnValue({
      stats: null,
      chartData: [],
      loading: true,
      isSuperAdmin: true
    });

    render(<DashboardTab />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('should display error state if stats are null and not loading', () => {
    mockCanDo.mockReturnValue(true);
    mockUseDashboard.mockReturnValue({
      stats: null,
      chartData: [],
      loading: false,
      isSuperAdmin: true
    });

    render(<DashboardTab />);
    expect(screen.getByText('common.error')).toBeInTheDocument();
  });
});
