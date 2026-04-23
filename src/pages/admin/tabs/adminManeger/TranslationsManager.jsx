import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaLanguage, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import DataTable from '../../ui/DataTable'; 
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { useModals } from '../../ui/ModalContext';

// Імпортуємо ключі, які зібрав скрипт
import extractedKeys from '../../../../extracted_keys.json';

const getNormalizedKeys = (keysData) => {
    if (Array.isArray(keysData)) return keysData;
    if (typeof keysData === 'object' && keysData !== null) return Object.keys(keysData);
    return [];
};
const normalizedKeys = getNormalizedKeys(extractedKeys);

export default function TranslationsManager() {
    const { t } = useTranslation('db');
    const { showAlert, showConfirm } = useModals();
    const [translations, setTranslations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);

    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditResults, setAuditResults] = useState({ missingInDb: [], unusedInCode: [] });

    const initialForm = { translation_key: '', uk: '', pl: '', en: '' };
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
                setUserRole(data?.role);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    // ОНОВЛЕНА ФУНКЦІЯ З ПАГІНАЦІЄЮ ДЛЯ ОБХОДУ ЛІМІТУ 1000
    const fetchTranslations = async () => {
        setIsLoading(true);
        try {
            let allData = [];
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
            console.log(`✅ TranslationsManager завантажив ${allData.length} ключів.`);
        } catch (error) {
            console.error("Error loading translations:", error);
            showAlert(t('common.error'), 'Не вдалося завантажити всі переклади', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ОНОВЛЕНА ЛОГІКА АУДИТУ
    const runAudit = () => {
        const dbKeys = translations.map(tr => tr.translation_key);
        
        // 1. Є в коді, але НЕМАЄ в базі (тільки повні ключі, ігноруємо префікси)
        const missingInDb = normalizedKeys.filter(key => {
            if (key.endsWith('.') || key.endsWith('_')) return false;
            return !dbKeys.includes(key);
        });
        
        // 2. Є в базі, але НЕМАЄ в коді
        const unusedInCode = dbKeys.filter(dbKey => {
             // Ключ вважається вживаним, якщо:
             // - є точний збіг у коді
             // - або в коді є префікс, який починає цей ключ
             return !normalizedKeys.some(codeKey => 
                 dbKey === codeKey || (codeKey.endsWith('.') && dbKey.startsWith(codeKey)) || (codeKey.endsWith('_') && dbKey.startsWith(codeKey))
             );
        });

        setAuditResults({ missingInDb, unusedInCode });
        setIsAuditModalOpen(true);
    };

    const handleDeleteUnused = async () => {
        if (auditResults.unusedInCode.length === 0) return;
        
        showConfirm(
            t('admin_translations.audit.title', {defaultValue: 'Аналіз перекладів'}),
            t('admin_translations.audit.confirm_delete_all', { count: auditResults.unusedInCode.length, defaultValue: `Видалити ${auditResults.unusedInCode.length} зайвих ключів?` }),
            async () => {
                setIsLoading(true);
                try {
                    // Видалення також має ліміт у Supabase. Якщо зайвих більше 1000, 
                    // краще видаляти їх частками, але зазвичай зайвих менше.
                    const { error } = await supabase
                        .from('translations')
                        .delete()
                        .in('translation_key', auditResults.unusedInCode.slice(0, 999)); // Запобіжник
                        
                    if (error) throw error;
                    
                    showAlert(t('common.success'), t('admin_translations.audit.delete_success', {defaultValue: 'Зайві ключі видалено'}), 'success');
                    setIsAuditModalOpen(false);
                    fetchTranslations();
                } catch (error) {
                    showAlert(t('common.error'), error.message, 'error');
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    const handleQuickAdd = (key) => {
        setFormData({ ...initialForm, translation_key: key });
        setIsEditing(false);
        setIsAuditModalOpen(false);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = (item) => {
        setFormData(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleDelete = async (key) => {
        showConfirm(
            t('common.confirm_delete_title', {defaultValue: 'Видалити?'}),
            t('common.confirm_delete', {defaultValue: 'Ви впевнені, що хочете видалити цей переклад?'}),
            async () => {
                try {
                    const { error } = await supabase.from('translations').delete().eq('translation_key', key);
                    if (error) throw error;
                    fetchTranslations();
                } catch (error) {
                    showAlert(t('common.error'), error.message, 'error');
                }
            }
        );
    };

    const handleSubmit = async (e) => {
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
            showAlert(t('common.success'), t('common.save_success', {defaultValue: 'Збережено'}), 'success');
        } catch (error) {
            showAlert(t('common.error'), error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isSuperAdmin = userRole === 'super_admin';

    const columns = useMemo(() => [
        { 
            header: t('admin_translations.table.key', {defaultValue: 'Ключ'}), 
            render: (row) => {
                const isUnused = !normalizedKeys.some(codeKey => 
                    row.translation_key === codeKey || (codeKey.endsWith('.') && row.translation_key.startsWith(codeKey)) || (codeKey.endsWith('_') && row.translation_key.startsWith(codeKey))
                );
                return (
                    <span className={`font-bold text-[0.85rem] px-2.5 py-1 rounded-md border shadow-sm font-mono flex items-center gap-2 w-fit ${
                        isUnused ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-main text-textMain border-border'
                    }`}>
                        {row.translation_key}
                        {isUnused && <FaExclamationTriangle size={10} title={t('admin_translations.audit.not_found_tooltip', {defaultValue: 'Не знайдено в коді'})} />}
                    </span>
                );
            }
        },
        { header: '🇺🇦 UK', render: (row) => <span className="text-[0.9rem] font-medium text-textMuted truncate max-w-[200px] block">{row.uk}</span> },
        { header: '🇵🇱 PL', render: (row) => <span className="text-[0.9rem] font-medium text-textMuted truncate max-w-[200px] block">{row.pl}</span> },
        { header: '🇬🇧 EN', render: (row) => <span className="text-[0.9rem] font-medium text-textMuted truncate max-w-[200px] block">{row.en}</span> },
        { 
            header: t('admin_translations.table.actions', {defaultValue: 'Дії'}), 
            render: (row) => (
                <div className="flex justify-end gap-2">
                    {isSuperAdmin && (
                        <>
                            <button onClick={() => handleEdit(row)} className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-primary/10 hover:text-primary shadow-sm"><FaEdit size={12} /></button>
                            <button onClick={() => handleDelete(row.translation_key)} className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 shadow-sm"><FaTrash size={12} /></button>
                        </>
                    )}
                </div>
            )
        }
    ], [t, isSuperAdmin, normalizedKeys]);

    const modalActions = (
        <div className="flex gap-2 justify-end w-full">
            <Button variant="cancel" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="!border-transparent">
                {t('common.cancel')}
            </Button>
            <Button type="submit" form="translationForm" variant="primary" disabled={isLoading} className="shadow-md !bg-emerald-600 hover:!bg-emerald-500">
                {isLoading ? t('common.saving') : t('common.save')}
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            {/* Header */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-emerald-500/10 text-success rounded-2xl border border-emerald-500/20 flex items-center justify-center text-[1.5rem] shadow-inner">
                        <FaLanguage />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.5rem] text-textMain font-extrabold tracking-tight">{t('admin_translations.tab.title', {defaultValue: 'Переклади'})}</h2>
                        <p className="m-0 text-textMuted text-[0.95rem] font-medium mt-1">{t('admin_translations.tab.count_info', { count: translations.length, defaultValue: `${translations.length} ключів у базі` })}</p>
                    </div>
                </div>
                
                <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                    <Button variant="secondary" onClick={runAudit} className="flex-1 sm:flex-none !border-blue-500/30 text-blue-600 hover:bg-blue-500/5">
                        <FaCheckCircle className="mr-2" /> {t('admin_translations.btn.audit', {defaultValue: 'Перевірити коди'})}
                    </Button>
                    {isSuperAdmin && (
                        <Button variant="success" onClick={handleAddNew} className="flex-1 sm:flex-none shadow-md !px-6">
                            <FaPlus /> {t('admin_translations.btn.add', {defaultValue: 'Додати'})}
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <DataTable columns={columns} data={translations} emptyMessage={t('admin_translations.table.empty', {defaultValue: 'Немає даних'})} />
            </div>

            {/* Audit Modal */}
            <BaseModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} title={t('admin_translations.audit.title', {defaultValue: 'Аналіз цілісності'})} maxWidth="650px">
                <div className="p-6 flex flex-col gap-8">
                    <section>
                        <h3 className="text-danger flex items-center gap-2 font-bold mb-4">
                            <FaExclamationTriangle /> {t('admin_translations.audit.missing_title', {defaultValue: 'Відсутні в базі:'})}
                        </h3>
                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                            {auditResults.missingInDb.length > 0 ? auditResults.missingInDb.map(key => (
                                <div key={key} className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <code className="text-xs text-danger font-bold">{key}</code>
                                    <Button size="sm" variant="success" onClick={() => handleQuickAdd(key)} className="!py-1 !px-3 !text-[0.75rem]">{t('admin_translations.audit.add_btn', {defaultValue: 'Додати'})}</Button>
                                </div>
                            )) : <p className="text-textMuted text-sm italic">{t('admin_translations.audit.missing_empty', {defaultValue: 'Всі ключі з коду є в базі.'})}</p>}
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-amber-600 flex items-center gap-2 font-bold m-0">
                                <FaTrash /> {t('admin_translations.audit.unused_title', {defaultValue: 'Зайві в базі:'})}
                            </h3>
                            {auditResults.unusedInCode.length > 0 && isSuperAdmin && (
                                <Button 
                                    size="sm" 
                                    onClick={handleDeleteUnused} 
                                    disabled={isLoading}
                                    className="!bg-red-500 hover:!bg-red-600 !text-white !border-transparent text-xs py-1"
                                >
                                    {isLoading ? t('common.loading') : t('admin_translations.audit.delete_unused_btn', { count: auditResults.unusedInCode.length, defaultValue: `Видалити всі (${auditResults.unusedInCode.length})` })}
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                            {auditResults.unusedInCode.length > 0 ? auditResults.unusedInCode.map(key => (
                                <span key={key} className="text-[0.7rem] font-mono bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-1 rounded">
                                    {key}
                                </span>
                            )) : <p className="text-textMuted text-sm italic">{t('admin_translations.audit.unused_empty', {defaultValue: 'Зайвих ключів не знайдено.'})}</p>}
                        </div>
                    </section>
                </div>
            </BaseModal>

            {/* Standard Edit/Add Modal */}
            <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('admin_translations.modal.title_edit') : t('admin_translations.modal.title_add')} maxWidth="550px" actions={modalActions}>
                <form id="translationForm" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <FormGroup label={t('admin_translations.modal.key_label', {defaultValue: 'Унікальний ключ'})} className="mb-0">
                        <Input required type="text" name="translation_key" value={formData.translation_key} onChange={handleInputChange} disabled={isEditing} className="!font-mono" />
                    </FormGroup>
                    <div className="flex flex-col gap-4 bg-main p-5 rounded-xl border border-border shadow-inner">
                        <FormGroup label="🇺🇦 UK"><Input required name="uk" value={formData.uk} onChange={handleInputChange} className="!bg-surface" /></FormGroup>
                        <FormGroup label="🇵🇱 PL"><Input required name="pl" value={formData.pl} onChange={handleInputChange} className="!bg-surface" /></FormGroup>
                        <FormGroup label="🇬🇧 EN"><Input required name="en" value={formData.en} onChange={handleInputChange} className="!bg-surface" /></FormGroup>
                    </div>
                </form>
            </BaseModal>
        </div>
    );
}