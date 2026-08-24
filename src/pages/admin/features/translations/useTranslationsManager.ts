import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { adminTranslationsApi } from '@admin/features/translations/adminTranslationsApi';
import extractedKeys from '../../../../extracted_keys.json';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { TranslationData } from './types';

const getNormalizedKeys = (keysData: unknown) => {
    if (Array.isArray(keysData)) return keysData;
    if (typeof keysData === 'object' && keysData !== null) return Object.keys(keysData);
    return [];
};

export const normalizedKeys = getNormalizedKeys(extractedKeys);

const initialForm = { translation_key: '', uk: '', pl: '', en: '' };

export function useTranslationsManager() {
    const { t } = useTranslation('db');
    const { showAlert, showConfirm } = useModals();
    const { withLogging } = useActionLogger();
    const [translations, setTranslations] = useState<TranslationData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditResults, setAuditResults] = useState<{ missingInDb: string[], unusedInCode: string[] }>({ missingInDb: [], unusedInCode: [] });

    const [formData, setFormData] = useState(initialForm);
    const [isEditing, setIsEditing] = useState(false);

    const fetchTranslations = useCallback(async () => {
        setIsLoading(true);
        try {
            const allData = await adminTranslationsApi.getAll();
            setTranslations(allData as TranslationData[]);
        } catch (error: unknown) {
            console.error("Error loading translations:", error);
            showAlert(t('common.error'), t('admin_translations.load_error'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [t, showAlert]);

    useEffect(() => {
        fetchTranslations();
    }, [fetchTranslations]);

    const runAudit = () => {
        const dbKeys = translations.map(tr => tr.translation_key);
        const missingInDb = normalizedKeys.filter(key => {
            if (key.endsWith('.') || key.endsWith('_')) return false;
            return !dbKeys.includes(key);
        });
        const unusedInCode = dbKeys.filter(dbKey => {
             return !normalizedKeys.some(codeKey =>
                 dbKey === codeKey || (codeKey.endsWith('.') && dbKey.startsWith(codeKey)) || (codeKey.endsWith('_') && dbKey.startsWith(codeKey))
             );
        });
        setAuditResults({ missingInDb, unusedInCode });
        setIsAuditModalOpen(true);
    };

    const handleDeleteUnused = () => {
        if (auditResults.unusedInCode.length === 0) return;
        showConfirm(
            t('admin_translations.audit.title'),
            t('admin_translations.audit.confirm_delete_all', { count: auditResults.unusedInCode.length }),
            async () => {
                try {
                    await adminTranslationsApi.deleteMany(auditResults.unusedInCode);
                    showAlert(t('common.success'), t('admin_translations.tab.delete_unused_success', { count: auditResults.unusedInCode.length }), 'success');
                    setIsAuditModalOpen(false);
                    fetchTranslations();
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Error';
                    showAlert(t('common.error'), msg, 'error');
                }
            },
            { confirmVariant: 'danger' }
        );
    };

    const handleQuickAdd = (key: string) => {
        setFormData({ ...initialForm, translation_key: key });
        setIsEditing(false);
        setIsAuditModalOpen(false);
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = (item: typeof initialForm) => {
        setFormData(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleDelete = (key: string) => {
        showConfirm(
            t('common.confirm_delete_title'),
            t('common.confirm_delete'),
            async () => {
                try {
                    await withLogging('delete_translation', () => adminTranslationsApi.delete(key), { key });
                    await fetchTranslations();
                    showAlert(t('common.success'), t('admin_translations.key_deleted'), 'success');
                } catch (error: unknown) {
                    const msg = error instanceof Error ? error.message : 'Error';
                    showAlert(t('common.error'), msg, 'error');
                }
            },
            { confirmVariant: 'danger' }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing) {
                const payload = { uk: formData.uk, pl: formData.pl, en: formData.en };
                await withLogging('update_translation', () => adminTranslationsApi.update(formData.translation_key, payload), { key: formData.translation_key, payload });
            } else {
                await withLogging('insert_translation', () => adminTranslationsApi.insert(formData), { formData });
            }
            setIsModalOpen(false);
            fetchTranslations();
            showAlert(t('common.success'), t('common.save_success'), 'success');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error';
            showAlert(t('common.error'), msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        t,
        translations,
        isLoading,
        isModalOpen,
        setIsModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        auditResults,
        formData,
        isEditing,
        runAudit,
        handleDeleteUnused,
        handleQuickAdd,
        handleInputChange,
        handleEdit,
        handleAddNew,
        handleDelete,
        handleSubmit,
    };
}
