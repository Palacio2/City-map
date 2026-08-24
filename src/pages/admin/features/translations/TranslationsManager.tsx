import { useMemo, useState, useEffect } from 'react';
import { FaLanguage, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import DataTable from '@admin/core/ui/DataTable';
import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { Input, FormGroup } from '@admin/core/ui/Input';
import { useTranslationsManager, normalizedKeys } from '@admin/features/translations/useTranslationsManager';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { TranslationData } from './types';

const PAGE_SIZE = 50;

export default function TranslationsManager() {
    const logic = useTranslationsManager();
    const { canDo } = useActionGuard();
    const { t } = logic;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredTranslations = useMemo(() => {
        if (!searchQuery.trim()) return logic.translations;
        const lowerQuery = searchQuery.toLowerCase();
        return logic.translations.filter((tr: TranslationData) => 
            tr.translation_key.toLowerCase().includes(lowerQuery) ||
            tr.uk?.toLowerCase().includes(lowerQuery) ||
            tr.pl?.toLowerCase().includes(lowerQuery) ||
            tr.en?.toLowerCase().includes(lowerQuery)
        );
    }, [logic.translations, searchQuery]);

    const totalPages = Math.ceil(filteredTranslations.length / PAGE_SIZE) || 1;
    const paginatedTranslations = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredTranslations.slice(start, start + PAGE_SIZE);
    }, [filteredTranslations, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const columns = useMemo(() => [
        {
            header: t('admin_translations.table.key'),
            render: (row: TranslationData) => {
                const isUnused = !normalizedKeys.some(codeKey =>
                    row.translation_key === codeKey || (codeKey.endsWith('.') && row.translation_key.startsWith(codeKey)) || (codeKey.endsWith('_') && row.translation_key.startsWith(codeKey))
                );
                return (
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1.5 ${
                        isUnused ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-main text-textMain border-border/80'
                    }`}>
                        {row.translation_key}
                        {isUnused && <FaExclamationTriangle size={10} title={t('admin_translations.audit.not_found_tooltip')} />}
                    </span>
                );
            }
        },
        { header: '🇺🇦 UK', render: (row: TranslationData) => <span className="text-xs font-medium text-textMain truncate max-w-[200px] block">{row.uk}</span> },
        { header: '🇵🇱 PL', render: (row: TranslationData) => <span className="text-xs font-medium text-textMuted truncate max-w-[200px] block">{row.pl}</span> },
        { header: '🇬🇧 EN', render: (row: TranslationData) => <span className="text-xs font-medium text-textMuted truncate max-w-[200px] block">{row.en}</span> },
        {
            header: '',
            render: (row: TranslationData) => (
                <div className="flex justify-end gap-1">
                    {canDo('translations.edit') && (
                        <button onClick={() => logic.handleEdit(row)} className="p-1.5 text-textMuted hover:text-primary hover:bg-primary-subtle rounded-lg transition-colors" title={t('common.edit')}><FaEdit className="text-xs" /></button>
                    )}
                    {canDo('translations.delete') && (
                        <button onClick={() => logic.handleDelete(row.translation_key)} className="p-1.5 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors" title={t('common.delete')}><FaTrash className="text-xs" /></button>
                    )}
                </div>
            )
        }
    ], [t, logic, canDo]);

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
        <div className="flex flex-col gap-6 w-full pb-4 flex-1 h-full">
            {/* Header & Controls */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 flex items-center justify-center text-base shadow-2xs">
                            <FaLanguage />
                        </div>
                        <div>
                            <h2 className="m-0 text-base sm:text-lg font-bold text-textMain tracking-tight">{t('admin_translations.tab.title')}</h2>
                            <p className="m-0 text-textMuted text-xs mt-0.5 font-medium">{t('admin_translations.tab.count_info', { count: filteredTranslations.length })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canDo('translations.audit') && (
                            <Button variant="cancel" size="sm" onClick={logic.runAudit}>
                                <FaCheckCircle className="text-xs" /> {t('admin_translations.btn.audit')}
                            </Button>
                        )}
                        {canDo('translations.add') && (
                            <Button variant="primary" size="sm" onClick={logic.handleAddNew}>
                                <FaPlus className="text-xs" /> {t('admin_translations.btn.add')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textMuted">
                        <FaSearch className="text-xs" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('admin_translations.search_placeholder', 'Пошук перекладів (ключ, або текст)...')}
                        className="w-full pl-9 pr-4 py-2 bg-main/40 border border-border rounded-xl text-xs text-textMain font-medium focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={paginatedTranslations}
                        emptyMessage={t('admin_translations.table.empty')}
                    />
                </div>
                
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-3 bg-surface border-t border-border">
                        <Button 
                            size="sm" 
                            variant="cancel" 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            {t('common.prev')}
                        </Button>
                        <span className="text-[11px] text-textMuted font-bold">
                            {currentPage} / {totalPages}
                        </span>
                        <Button 
                            size="sm" 
                            variant="cancel" 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            {t('common.next')}
                        </Button>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            <BaseModal isOpen={logic.isModalOpen} onClose={() => logic.setIsModalOpen(false)} title={logic.isEditing ? t('admin_translations.modal.title_edit') : t('admin_translations.modal.title_add')} maxWidth="560px" actions={modalActions}>
                <form id="translationForm" onSubmit={logic.handleSubmit} className="flex flex-col gap-4">
                    <FormGroup label={t('admin_translations.modal.key_label')} className="mb-0">
                        <Input 
                            required 
                            type="text" 
                            name="translation_key" 
                            value={logic.formData.translation_key} 
                            onChange={logic.handleInputChange} 
                            disabled={logic.isEditing} 
                            className="font-mono text-xs font-bold" 
                            placeholder="e.g. common.buttons.save" 
                        />
                    </FormGroup>

                    <div className="flex flex-col gap-3 mt-1">
                        <div className="relative group">
                            <div className="absolute left-3 top-3 flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-border shadow-2xs select-none">
                                🇺🇦
                            </div>
                            <textarea
                                required
                                name="uk"
                                value={logic.formData.uk}
                                onChange={logic.handleInputChange}
                                className="w-full pl-12 pr-4 py-3 bg-main/40 dark:bg-main/60 border border-border rounded-xl text-xs text-textMain focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all min-h-[70px] shadow-2xs hover:border-primary/50 resize-y"
                                placeholder={t('admin_translations.modal.uk_placeholder')}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-border shadow-2xs select-none">
                                🇵🇱
                            </div>
                            <textarea
                                required
                                name="pl"
                                value={logic.formData.pl}
                                onChange={logic.handleInputChange}
                                className="w-full pl-12 pr-4 py-3 bg-main/40 dark:bg-main/60 border border-border rounded-xl text-xs text-textMain focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all min-h-[70px] shadow-2xs hover:border-primary/50 resize-y"
                                placeholder={t('admin_translations.modal.pl_placeholder')}
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-3 flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-border shadow-2xs select-none">
                                🇬🇧
                            </div>
                            <textarea
                                required
                                name="en"
                                value={logic.formData.en}
                                onChange={logic.handleInputChange}
                                className="w-full pl-12 pr-4 py-3 bg-main/40 dark:bg-main/60 border border-border rounded-xl text-xs text-textMain focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all min-h-[70px] shadow-2xs hover:border-primary/50 resize-y"
                                placeholder={t('admin_translations.modal.en_placeholder')}
                            />
                        </div>
                    </div>
                </form>
            </BaseModal>

            {/* AUDIT MODAL */}
            <BaseModal isOpen={logic.isAuditModalOpen} onClose={() => logic.setIsAuditModalOpen(false)} title={t('admin_translations.audit.title')} maxWidth="600px">
                <div className="flex flex-col gap-6">
                    {/* Missing Translations */}
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex flex-col gap-3">
                        <h3 className="text-xs font-bold text-rose-600 flex items-center gap-2 m-0 uppercase tracking-wider">
                            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                                <FaExclamationTriangle />
                            </div>
                            {t('admin_translations.audit.missing_title')}
                        </h3>
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {logic.auditResults.missingInDb.length > 0 ? logic.auditResults.missingInDb.map(key => (
                                <div key={key} className="flex justify-between items-center p-2.5 bg-surface border border-rose-500/20 rounded-xl shadow-2xs hover:border-rose-500/40 transition-colors">
                                    <code className="text-xs text-rose-600 font-mono font-bold break-all pr-2">{key}</code>
                                    <Button size="sm" variant="success" onClick={() => logic.handleQuickAdd(key)} className="shrink-0 h-7 text-[10px]">
                                        <FaPlus className="text-[10px]" /> {t('admin_translations.audit.add_btn')}
                                    </Button>
                                </div>
                            )) : <p className="text-textMuted text-xs italic m-0 font-medium">{t('admin_translations.audit.missing_empty')}</p>}
                        </div>
                    </div>

                    {/* Unused Translations */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-amber-600 flex items-center gap-2 m-0 uppercase tracking-wider">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <FaTrash className="text-[10px]" />
                                </div>
                                {t('admin_translations.audit.unused_title')}
                            </h3>
                            {logic.auditResults.unusedInCode.length > 0 && canDo('translations.delete') && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={logic.handleDeleteUnused}
                                    disabled={logic.isLoading}
                                    className="h-7 text-[10px]"
                                >
                                    <FaTrash className="text-[10px]" /> {t('admin_translations.audit.delete_unused_btn')}
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {logic.auditResults.unusedInCode.length > 0 ? logic.auditResults.unusedInCode.map(key => (
                                <div key={key} className="flex justify-between items-center p-2.5 bg-surface border border-amber-500/20 rounded-xl shadow-2xs">
                                    <code className="text-xs text-amber-600 font-mono font-bold break-all">{key}</code>
                                </div>
                            )) : <p className="text-textMuted text-xs italic m-0 font-medium">{t('admin_translations.audit.unused_empty')}</p>}
                        </div>
                    </div>
                </div>
            </BaseModal>
        </div>
    );
}