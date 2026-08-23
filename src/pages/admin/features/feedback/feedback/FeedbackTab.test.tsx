import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('FeedbackTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActionGuard.mockReturnValue({
      canDo: vi.fn().mockReturnValue(true)
    });
    mockUseFeedback.mockReturnValue({
      loading: false,
      filter: 'all',
      setFilter: vi.fn(),
      filteredMessages: [],
      handleDelete: vi.fn(),
      handleStatusChange: vi.fn(),
      refetch: vi.fn()
    });
  });

  const renderComponent = () => render(
    <FeedbackTab />
  );

  it('renders the feedback tab correctly', () => {
    renderComponent();
    expect(screen.getByText('admin_feedback.tab.title')).toBeInTheDocument();
  });
});
