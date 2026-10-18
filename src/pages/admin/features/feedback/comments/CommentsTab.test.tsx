import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommentsTab from './CommentsTab';

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

const mockUseComments = vi.fn();
vi.mock('@admin/features/feedback/comments/useComments', () => ({
  useComments: () => mockUseComments()
}));

// Mock child components to simplify testing
vi.mock('@admin/core/ui/DataTable', () => ({
  default: ({ columns, emptyMessage }: { columns: Record<string, unknown>[], emptyMessage: string }) => (
    <div data-testid="data-table">
      {columns.map((col) => (
        <span key={String(col.header)} data-testid={`col-${String(col.header)}`}>{String(col.header)}</span>
      ))}
      <div data-testid="empty-msg">{emptyMessage}</div>
    </div>
  )
}));

describe('CommentsTab Access Control Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseLogic = {
    comments: [{ id: '1', content: 'Test Comment', is_hidden: false, created_at: new Date().toISOString(), user_id: '123' }],
    usersMap: { '123': { email: 'test@test.com', role: 'user' } },
    loading: false,
    loadData: vi.fn(),
    handleToggleHide: vi.fn(),
    handleDelete: vi.fn(),
    cities: [],
    districts: [],
    selectedCity: '',
    setSelectedCity: vi.fn(),
    selectedDistrict: '',
    setSelectedDistrict: vi.fn(),
    districtsLoading: false
  };

  it('should render everything for super admin', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: () => true
    });
    mockUseComments.mockReturnValue(baseLogic);

    render(<CommentsTab />);

    // Columns should be present
    expect(screen.getByTestId('col-admin_comments.tab.col_author')).toBeInTheDocument();
  });

  it('should display empty message when there are no comments', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: () => true
    });
    mockUseComments.mockReturnValue({
      ...baseLogic,
      comments: []
    });

    render(<CommentsTab />);

    expect(screen.getByText('admin_comments.tab.empty')).toBeInTheDocument();
  });

  it('should display loading state correctly', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: () => true
    });
    mockUseComments.mockReturnValue({
      ...baseLogic,
      loading: true
    });

    render(<CommentsTab />);
    expect(screen.getByText('admin_comments.tab.loading')).toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });
});
