import { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { useModals } from '../ui/ModalContext';
import extractedKeys from '../../../extracted_keys.json';

const getNormalizedKeys = (keysData: any) => {
    if (Array.isArray(keysData)) return keysData;
    if (typeof keysData === 'object' && keysData !== null) return Object.keys(keysData);
    return [];
};

export const normalizedKeys = getNormalizedKeys(extractedKeys);

const initialForm = { translation_key: '', uk: '', pl: '', en: '' };

export function useTranslationsManager() {
    const { t } = useTranslation('db');
    const { showAlert, showConfirm } = useModals();
    const [translations, setTranslations] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditResults, setAuditResults] = useState<{ missingInDb: string[], unusedInCode: string[] }>({ missingInDb: [], unusedInCode: [] });

    const [formData, setFormData] = useState(initialForm);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchTranslations();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('admin_profiles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();
                setUserRole(data?.role ?? null);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchTranslations = async () => {
        setIsLoading(true);
        try {
            let allData: any[] = [];
            let from = 0;
            const limit = 1000;
            let hasMore = true;
            while (hasMore) {
                const { data, error } = await supabase
                    .from('translations')
                    .select('*')
                    .order('translation_key')
                    .range(from, from + limit - 1);
                if (error) throw error;
                allData = [...allData, ...data];
                if (data.length < limit) {
                    hasMore = false;
                } else {
                    from += limit;
                }
            }
            setTranslations(allData);
        } catch (error) {
            console.error("Error loading translations:", error);
            showAlert(t('common.error'), 'Не вдалося завантажити всі переклади', 'error');
        } finally {
            setIsLoading(false);
        }
    };

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
            t('admin_translations.audit.confirm_delete_all', { count: auditResults.unusedInCode.length, defaultValue: `Видалити ${auditResults.unusedInCode.length} зайвих ключів?` }),
            async () => {
                setIsLoading(true);
                try {
                    const { error } = await supabase
                        .from('translations')
                        .delete()
                        .in('translation_key', auditResults.unusedInCode.slice(0, 999));
                    if (error) throw error;
                    showAlert(t('common.success'), t('admin_translations.audit.delete_success'), 'success');
                    setIsAuditModalOpen(false);
                    fetchTranslations();
                } catch (error: any) {
                    showAlert(t('common.error'), error.message, 'error');
                } finally {
                    setIsLoading(false);
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

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = (item: any) => {
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
                    const { error } = await supabase.from('translations').delete().eq('translation_key', key);
                    if (error) throw error;
                    fetchTranslations();
                    showAlert(t('common.success'), 'Ключ видалено', 'success');
                } catch (error: any) {
                    showAlert(t('common.error'), error.message, 'error');
                }
            },
            { confirmVariant: 'danger' }
        );
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing) {
                const { error } = await supabase.from('translations').update({
                    uk: formData.uk, pl: formData.pl, en: formData.en
                }).eq('translation_key', formData.translation_key);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('translations').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchTranslations();
            showAlert(t('common.success'), t('common.save_success'), 'success');
        } catch (error: any) {
            showAlert(t('common.error'), error.message, 'error');
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
        userRole,
        isSuperAdmin: userRole === 'super_admin',
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
