import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TranslationsManager from './TranslationsManager';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uk' }
  })
}));

vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: vi.fn()
}));

vi.mock('@admin/features/translations/useTranslationsManager', () => ({
  useTranslationsManager: vi.fn(),
  normalizedKeys: ['common.save']
}));

// We need a dummy extracted_keys.json to avoid import errors
vi.mock('../../../../extracted_keys.json', () => ({
  default: ['common.save']
}));

import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useTranslationsManager } from '@admin/features/translations/useTranslationsManager';

describe('TranslationsManager Access Control', () => {
  const baseTranslations = [
    { translation_key: 'common.save', uk: 'Зберегти', pl: 'Zapisz', en: 'Save' }
  ];

  const mockHandleAddNew = vi.fn();
  const mockHandleEdit = vi.fn();
  const mockHandleDelete = vi.fn();
  const mockRunAudit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslationsManager).mockReturnValue({
      t: (key: string) => key,
      translations: baseTranslations,
      isModalOpen: false,
      setIsModalOpen: vi.fn(),
      isAuditModalOpen: false,
      setIsAuditModalOpen: vi.fn(),
      auditResults: { missingInDb: [], unusedInCode: [] },
      isLoading: false,
      isEditing: false,
      formData: { translation_key: '', uk: '', pl: '', en: '' },
      handleAddNew: mockHandleAddNew,
      handleEdit: mockHandleEdit,
      handleDelete: mockHandleDelete,
      runAudit: mockRunAudit,
      handleQuickAdd: vi.fn(),
      handleSubmit: vi.fn(),
      handleInputChange: vi.fn(),
    });
  });

  it('should render add button when having translations.add permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: (action: string) => action === 'translations.add',
      isSuperAdmin: false
    } as ReturnType<typeof useActionGuard>);

    render(<TranslationsManager />);
    expect(screen.getByText('admin_translations.btn.add')).toBeInTheDocument();
  });

  it('should not render add button when missing translations.add permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: () => false,
      isSuperAdmin: false
    } as ReturnType<typeof useActionGuard>);

    render(<TranslationsManager />);
    expect(screen.queryByText('admin_translations.btn.add')).not.toBeInTheDocument();
  });

  it('should render audit button when having translations.audit permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: (action: string) => action === 'translations.audit',
      isSuperAdmin: false
    } as ReturnType<typeof useActionGuard>);

    render(<TranslationsManager />);
    expect(screen.getByText('admin_translations.btn.audit')).toBeInTheDocument();
  });

  it('should not render audit button when missing translations.audit permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: () => false,
      isSuperAdmin: false
    } as ReturnType<typeof useActionGuard>);

    render(<TranslationsManager />);
    expect(screen.queryByText('admin_translations.btn.audit')).not.toBeInTheDocument();
  });

  it('should render edit and delete buttons when having corresponding permissions', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: (action: string) => action === 'translations.edit' || action === 'translations.delete',
      isSuperAdmin: false
    } as ReturnType<typeof useActionGuard>);

    render(<TranslationsManager />);
    expect(screen.getByTitle('common.edit')).toBeInTheDocument();
    expect(screen.getByTitle('common.delete')).toBeInTheDocument();
  });

  it('should not render edit and delete buttons when missing permissions', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: () => false,
      isSuperAdmin: false
    } as ReturnType<typeof useActionGuard>);

    render(<TranslationsManager />);
    expect(screen.queryByTitle('common.edit')).not.toBeInTheDocument();
    expect(screen.queryByTitle('common.delete')).not.toBeInTheDocument();
  });
});
