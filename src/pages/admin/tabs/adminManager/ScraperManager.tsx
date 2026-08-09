import { FaPlus, FaEdit, FaTrash, FaRobot } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { CustomSelect } from '../../ui/CustomSelect';
import { Badge } from '../../ui/Badge';
import { useScraperManager } from '../../hooks/useScraperManager';
import { useMemo } from 'react';

export default function ScraperManager() {
    const logic = useScraperManager();
    const { t } = logic;

    const columns = useMemo(() => [
        {
            header: `${t('admin_scraper.table.country')} / ${t('admin_scraper.table.platform')}`,
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <Badge variant="primary">{row.country_code}</Badge>
                    <span className="font-semibold text-textMain capitalize text-xs">{row.platform}</span>
                </div>
            )
        },
        {
            header: t('admin_scraper.table.type'),
            render: (row: any) => (
                <Badge variant="purple">
                    {row.type === 'sale' ? t('admin_scraper.type.sale') : t('admin_scraper.type.rent')}
                </Badge>
            )
        },
        {
            header: t('admin_scraper.table.price_limits'),
            render: (row: any) => (
                <span className="font-mono text-[11px] text-textMuted whitespace-nowrap">
                    {row.min_price} - {row.max_price}
                </span>
            )
        },
        {
            header: t('admin_scraper.table.status'),
            render: (row: any) => row.is_active ? <Badge variant="success">{t('admin_scraper.status.active')}</Badge> : <Badge variant="default">{t('admin_scraper.status.inactive')}</Badge>
        },
        {
            header: '',
            render: (row: any) => (
                <div className="flex justify-end gap-1">
                    <button onClick={() => logic.handleEdit(row)} className="p-1.5 text-textMuted hover:text-primary hover:bg-primary-subtle rounded transition-colors" title={t('common.edit')}><FaEdit className="text-xs" /></button>
                    <button onClick={() => logic.handleDelete(row.id)} className="p-1.5 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors" title={t('common.delete')}><FaTrash className="text-xs" /></button>
                </div>
            )
        }
    ], [t, logic.handleEdit, logic.handleDelete]);

    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={() => logic.setIsModalOpen(false)} disabled={logic.isLoading}>
                {t('common.cancel')}
            </Button>
            <Button type="submit" form="scraperForm" variant="primary" size="sm" disabled={logic.isLoading}>
                {logic.isLoading ? t('common.saving') : t('common.save')}
            </Button>
        </>
    );

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-purple-600 rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaRobot />
                    </div>
                    <div>
                        <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">{t('admin_scraper.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5">{t('admin_scraper.tab.subtitle')} ({logic.rules.length})</p>
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={logic.handleAddNew}>
                    <FaPlus className="text-xs" /> {t('admin_scraper.btn.add')}
                </Button>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
                <DataTable
                    columns={columns}
                    data={logic.rules}
                    emptyMessage={t('admin_scraper.table.empty')}
                    rowClassName={(row: any) => !row.is_active ? 'opacity-50 bg-main' : ''}
                />
            </div>

            <BaseModal isOpen={logic.isModalOpen} onClose={() => logic.setIsModalOpen(false)} title={logic.isEditing ? t('admin_scraper.modal.title_edit') : t('admin_scraper.modal.title_add')} maxWidth="600px" actions={modalActions}>
                <form id="scraperForm" onSubmit={logic.handleSubmit} className="p-4 flex flex-col gap-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <FormGroup label={t('admin_scraper.modal.country')} className="mb-0">
                            <Input required type="text" name="country_code" value={logic.formData.country_code} onChange={logic.handleInputChange} className="uppercase h-9 text-xs" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.platform')} className="mb-0">
                            <Input required type="text" name="platform" value={logic.formData.platform} onChange={logic.handleInputChange} className="h-9 text-xs" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.type')} className="mb-0">
                            <CustomSelect
                                options={logic.typeOptions}
                                value={logic.formData.type}
                                onChange={(val) => logic.handleSelectChange('type', val)}
                                size="sm"
                            />
                        </FormGroup>
                    </div>

                    <FormGroup label={t('admin_scraper.modal.selector')} className="mb-0">
                        <Input required type="text" name="item_selector" value={logic.formData.item_selector} onChange={logic.handleInputChange} className="font-mono h-9 text-xs" />
                    </FormGroup>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormGroup label={t('admin_scraper.modal.price_regex')} className="mb-0">
                            <Input required type="text" name="price_regex" value={logic.formData.price_regex} onChange={logic.handleInputChange} className="font-mono h-9 text-xs" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.sqm_regex')} className="mb-0">
                            <Input required type="text" name="sqm_regex" value={logic.formData.sqm_regex} onChange={logic.handleInputChange} className="font-mono h-9 text-xs" />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-main/60 p-3 rounded-lg border border-border">
                        <FormGroup label={t('admin_scraper.modal.min_price')} className="mb-0">
                            <Input required type="number" name="min_price" value={logic.formData.min_price} onChange={logic.handleInputChange} className="bg-surface h-8 text-xs font-mono" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.max_price')} className="mb-0">
                            <Input required type="number" name="max_price" value={logic.formData.max_price} onChange={logic.handleInputChange} className="bg-surface h-8 text-xs font-mono" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.min_sqm')} className="mb-0">
                            <Input required type="number" name="min_sqm" value={logic.formData.min_sqm} onChange={logic.handleInputChange} className="bg-surface h-8 text-xs font-mono" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.max_sqm')} className="mb-0">
                            <Input required type="number" name="max_sqm" value={logic.formData.max_sqm} onChange={logic.handleInputChange} className="bg-surface h-8 text-xs font-mono" />
                        </FormGroup>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input type="checkbox" name="is_active" checked={logic.formData.is_active} onChange={logic.handleInputChange} className="accent-primary" />
                        <span className="text-xs font-medium text-textMain">{t('admin_scraper.modal.is_active')}</span>
                    </label>
                </form>
            </BaseModal>
        </div>
    );
}