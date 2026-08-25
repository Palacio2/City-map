import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FieldsManager from './FieldsManager';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uk' }
  })
}));

vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: vi.fn()
}));

vi.mock('@admin/features/fields/useFieldsManager', () => ({
  useFieldsManager: vi.fn()
}));

import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useFieldsManager } from '@admin/features/fields/useFieldsManager';

describe('FieldsManager Access Control', () => {
  const baseFields = [
    { id: '1', field_code: 'population', admin_label: 'Population', source_type: 'osm', is_active: true }
  ];

  const mockHandleAddNew = vi.fn();
  const mockHandleEdit = vi.fn();
  const mockHandleDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useFieldsManager as any).mockReturnValue({
      t: (key: string) => key,
      fields: baseFields,
      groups: [],
      isModalOpen: false,
      setIsModalOpen: vi.fn(),
      isLoading: false,
      isEditing: false,
      formData: {},
      handleAddNew: mockHandleAddNew,
      handleEdit: mockHandleEdit,
      handleDelete: mockHandleDelete,
    });
  });

  it('should render add button when having fields.add permission', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: (action: string) => action === 'fields.add'
    });

    render(<FieldsManager />);
    expect(screen.getByText('admin_fields.btn.add')).toBeInTheDocument();
  });

  it('should not render add button when missing fields.add permission', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: () => false
    });

    render(<FieldsManager />);
    expect(screen.queryByText('admin_fields.btn.add')).not.toBeInTheDocument();
  });

  it('should render edit and delete buttons when having corresponding permissions', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: (action: string) => action === 'fields.edit' || action === 'fields.delete'
    });

    render(<FieldsManager />);
    expect(screen.getByTitle('common.edit')).toBeInTheDocument();
    expect(screen.getByTitle('common.delete')).toBeInTheDocument();
  });

  it('should not render edit and delete buttons when missing permissions', () => {
    (useActionGuard as any).mockReturnValue({
      canDo: () => false
    });

    render(<FieldsManager />);
    expect(screen.queryByTitle('common.edit')).not.toBeInTheDocument();
    expect(screen.queryByTitle('common.delete')).not.toBeInTheDocument();
  });
});
