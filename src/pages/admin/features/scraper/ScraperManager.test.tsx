import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ScraperManager from './ScraperManager';

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

const mockUseScraperManager = vi.fn();
vi.mock('@admin/features/scraper/useScraperManager', () => ({
  useScraperManager: () => mockUseScraperManager()
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

vi.mock('@admin/core/ui/BaseModal', () => ({
  default: ({ isOpen, title }: { isOpen: boolean, title: string }) => isOpen ? <div data-testid="base-modal">{title}</div> : null
}));

describe('ScraperManager Access Control Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseLogic = {
    t: (key: string) => key,
    rules: [{ id: '1', country_code: 'UA', platform: 'olx', type: 'sale', min_price: 100, max_price: 200, is_active: true }],
    isModalOpen: false,
    setIsModalOpen: vi.fn(),
    isLoading: false,
    isEditing: false,
    formData: {},
    typeOptions: [],
    handleInputChange: vi.fn(),
    handleSelectChange: vi.fn(),
    handleEdit: vi.fn(),
    handleAddNew: vi.fn(),
    handleDelete: vi.fn(),
    handleSubmit: vi.fn()
  };

  it('should render add button when canDo(scraper.add_rule) is true', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: (action: string) => action === 'scraper.add_rule'
    });
    mockUseScraperManager.mockReturnValue(baseLogic);

    render(<ScraperManager />);

    expect(screen.getByText('admin_scraper.btn.add')).toBeInTheDocument();
  });

  it('should hide add button when canDo(scraper.add_rule) is false', () => {
    mockUseActionGuard.mockReturnValue({
      canDo: (action: string) => action !== 'scraper.add_rule'
    });
    mockUseScraperManager.mockReturnValue(baseLogic);

    render(<ScraperManager />);

    expect(screen.queryByText('admin_scraper.btn.add')).not.toBeInTheDocument();
  });
  
  it('should render correct columns based on the data', () => {
    mockUseActionGuard.mockReturnValue({
        canDo: () => true
    });
    mockUseScraperManager.mockReturnValue(baseLogic);
  
    render(<ScraperManager />);
  
    // Should render headers
    expect(screen.getByTestId('col-admin_scraper.table.type')).toBeInTheDocument();
    expect(screen.getByTestId('col-admin_scraper.table.status')).toBeInTheDocument();
  });
});
