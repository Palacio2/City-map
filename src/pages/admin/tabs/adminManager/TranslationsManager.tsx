import { FaLanguage, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { useTranslationsManager, normalizedKeys } from '../../hooks/useTranslationsManager';
import { useMemo } from 'react';

export default function TranslationsManager() {
    const logic = useTranslationsManager();
    const { t } = logic;

    const columns = useMemo(() => [
        {
            header: t('admin_translations.table.key'),
            render: (row: any) => {
                const isUnused = !normalizedKeys.some(codeKey =>
                    row.translation_key === codeKey || (codeKey.endsWith('.') && row.translation_key.startsWith(codeKey)) || (codeKey.endsWith('_') && row.translation_key.startsWith(codeKey))
                );
                return (
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${
                        isUnused ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-main text-textMain border-border'
                    }`}>
                        {row.translation_key}
                        {isUnused && <FaExclamationTriangle size={10} title={t('admin_translations.audit.not_found_tooltip')} />}
                    </span>
                );
            }
        },
        { header: '🇺🇦 UK', render: (row: any) => <span className="text-xs font-normal text-textMain truncate max-w-[200px] block">{row.uk}</span> },
        { header: '🇵🇱 PL', render: (row: any) => <span className="text-xs font-normal text-textMuted truncate max-w-[200px] block">{row.pl}</span> },
        { header: '🇬🇧 EN', render: (row: any) => <span className="text-xs font-normal text-textMuted truncate max-w-[200px] block">{row.en}</span> },
        {
            header: '',
            render: (row: any) => (
                <div className="flex justify-end gap-1">
                    {logic.isSuperAdmin && (
                        <>
                            <button onClick={() => logic.handleEdit(row)} className="p-1.5 text-textMuted hover:text-primary hover:bg-primary-subtle rounded transition-colors" title={t('common.edit')}><FaEdit className="text-xs" /></button>
                            <button onClick={() => logic.handleDelete(row.translation_key)} className="p-1.5 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors" title={t('common.delete')}><FaTrash className="text-xs" /></button>
                        </>
                    )}
                </div>
            )
        }
    ], [t, logic.isSuperAdmin, logic.handleEdit, logic.handleDelete]);

    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={() => logic.setIsModalOpen(false)} disabled={logic.isLoading}>
                {t('common.cancel')}
            </Button>
            <Button type="submit" form="translationForm" variant="primary" size="sm" disabled={logic.isLoading}>
                {logic.isLoading ? t('common.saving') : t('common.save')}
            </Button>
        </>
    );

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-emerald-600 rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaLanguage />
                    </div>
                    <div>
                        <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">{t('admin_translations.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5">{t('admin_translations.tab.count_info', { count: logic.translations.length, defaultValue: `${logic.translations.length} ключів перекладів у базі` })}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="cancel" size="sm" onClick={logic.runAudit}>
                        <FaCheckCircle className="text-xs" /> {t('admin_translations.btn.audit')}
                    </Button>
                    {logic.isSuperAdmin && (
                        <Button variant="primary" size="sm" onClick={logic.handleAddNew}>
                            <FaPlus className="text-xs" /> {t('admin_translations.btn.add')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={logic.translations} 
                    emptyMessage={t('admin_translations.table.empty')} 
                />
            </div>

            <BaseModal isOpen={logic.isAuditModalOpen} onClose={() => logic.setIsAuditModalOpen(false)} title={t('admin_translations.audit.title')} maxWidth="600px">
                <div className="p-4 flex flex-col gap-5">
                    <section className="flex flex-col gap-2">
                        <h3 className="text-xs font-semibold text-danger flex items-center gap-1.5 m-0">
                            <FaExclamationTriangle /> {t('admin_translations.audit.missing_title')}
                        </h3>
                        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {logic.auditResults.missingInDb.length > 0 ? logic.auditResults.missingInDb.map(key => (
                                <div key={key} className="flex justify-between items-center p-2 bg-danger-subtle border border-danger/20 rounded-lg">
                                    <code className="text-xs text-danger font-mono font-medium">{key}</code>
                                    <Button size="sm" variant="success" onClick={() => logic.handleQuickAdd(key)}>
                                        {t('admin_translations.audit.add_btn')}
                                    </Button>
                                </div>
                            )) : <p className="text-textMuted text-xs italic m-0">{t('admin_translations.audit.missing_empty')}</p>}
                        </div>
                    </section>

                    <section className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-semibold text-amber-600 flex items-center gap-1.5 m-0">
                                <FaTrash /> {t('admin_translations.audit.unused_title')}
                            </h3>
                            {logic.auditResults.unusedInCode.length > 0 && logic.isSuperAdmin && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={logic.handleDeleteUnused}
                                    disabled={logic.isLoading}
                                >
                                    {t('admin_translations.audit.delete_unused_btn', { count: logic.auditResults.unusedInCode.length, defaultValue: `Видалити всі (${logic.auditResults.unusedInCode.length})` })}
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {logic.auditResults.unusedInCode.length > 0 ? logic.auditResults.unusedInCode.map(key => (
                                <span key={key} className="text-[11px] font-mono bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded">
                                    {key}
                                </span>
                            )) : <p className="text-textMuted text-xs italic m-0">{t('admin_translations.audit.unused_empty')}</p>}
                        </div>
                    </section>
                </div>
            </BaseModal>

            <BaseModal isOpen={logic.isModalOpen} onClose={() => logic.setIsModalOpen(false)} title={logic.isEditing ? t('admin_translations.modal.title_edit') : t('admin_translations.modal.title_add')} maxWidth="500px" actions={modalActions}>
                <form id="translationForm" onSubmit={logic.handleSubmit} className="p-4 flex flex-col gap-3">
                    <FormGroup label={t('admin_translations.modal.key_label')} className="mb-0">
                        <Input required type="text" name="translation_key" value={logic.formData.translation_key} onChange={logic.handleInputChange} disabled={logic.isEditing} className="font-mono h-9 text-xs" />
                    </FormGroup>
                    <div className="flex flex-col gap-3 bg-main/60 p-3 rounded-xl border border-border">
                        <FormGroup label="🇺🇦 UK" className="mb-0"><Input required name="uk" value={logic.formData.uk} onChange={logic.handleInputChange} className="bg-surface h-9 text-xs" /></FormGroup>
                        <FormGroup label="🇵🇱 PL" className="mb-0"><Input required name="pl" value={logic.formData.pl} onChange={logic.handleInputChange} className="bg-surface h-9 text-xs" /></FormGroup>
                        <FormGroup label="🇬🇧 EN" className="mb-0"><Input required name="en" value={logic.formData.en} onChange={logic.handleInputChange} className="bg-surface h-9 text-xs" /></FormGroup>
                    </div>
                </form>
            </BaseModal>
        </div>
    );
}