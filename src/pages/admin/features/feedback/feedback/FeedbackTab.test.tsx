import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FeedbackTab from './FeedbackTab';

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

const mockUseFeedback = vi.fn();
vi.mock('@admin/features/feedback/feedback/useFeedback', () => ({
  useFeedback: () => mockUseFeedback()
}));

// Mock child components
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

describe('FeedbackTab', () => {
  const mockSetFilter = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActionGuard.mockReturnValue({
      canDo: vi.fn().mockReturnValue(true)
    });
    mockUseFeedback.mockReturnValue({
      loading: false,
      filter: 'all',
      setFilter: mockSetFilter,
      filteredMessages: [{ id: '1', message: 'Test message', created_at: new Date().toISOString() }],
      handleDelete: vi.fn(),
      handleStatusChange: vi.fn(),
      refetch: mockRefetch
    });
  });

  const renderComponent = () => render(
    <FeedbackTab />
  );

  it('renders the feedback tab correctly', () => {
    renderComponent();
    expect(screen.getByText('admin_feedback.tab.title')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    mockUseFeedback.mockReturnValueOnce({
      loading: true,
      filteredMessages: []
    });
    renderComponent();
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('calls setFilter when filter buttons are clicked', () => {
    renderComponent();
    const bugFilter = screen.getByText('admin_feedback.tab.filter_bugs');
    fireEvent.click(bugFilter);
    expect(mockSetFilter).toHaveBeenCalledWith('bug');
  });

  it('calls refetch when refresh button is clicked', () => {
    renderComponent();
    const refreshBtn = screen.getByTitle('common.refresh');
    fireEvent.click(refreshBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
