import { FaPlus, FaEdit, FaTrash, FaDatabase, FaCode } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { CustomSelect } from '../../ui/CustomSelect';
import { Badge } from '../../ui/Badge';
import { useFieldsManager } from '../../hooks/useFieldsManager';
import { useMemo } from 'react';

export default function FieldsManager() {
    const logic = useFieldsManager();
    const { t } = logic;

    const columns = useMemo(() => [
        {
            header: t('admin_fields.table.code'),
            render: (row: any) => <span className="font-mono text-primary font-semibold text-[11px] bg-primary-subtle px-2 py-0.5 rounded border border-primary/20">{row.field_code}</span>
        },
        {
            header: t('admin_fields.table.label'),
            render: (row: any) => <span className="font-medium text-textMain text-xs flex items-center gap-1.5">{row.icon} {row.admin_label}</span>
        },
        {
            header: t('admin_fields.table.group'),
            render: (row: any) => {
                const group = logic.groups.find(g => g.id === row.ui_group);
                return <span className="text-textMuted font-medium text-xs">{group ? group.label_key : row.ui_group}</span>;
            }
        },
        {
            header: t('admin_fields.modal.source_type'),
            render: (row: any) => (
                <Badge variant={row.source_type === 'osm' ? 'success' : row.source_type === 'gus' ? 'warning' : 'primary'}>
                    {(row.source_type || 'osm').toUpperCase()}
                </Badge>
            )
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
    ], [t, logic.groups, logic.handleEdit, logic.handleDelete]);

    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={() => logic.setIsModalOpen(false)} disabled={logic.isLoading}>
                {t('common.cancel')}
            </Button>
            <Button type="submit" form="fieldForm" variant="primary" size="sm" disabled={logic.isLoading || !!logic.jsonError}>
                {logic.isLoading ? t('common.saving') : t('common.save')}
            </Button>
        </>
    );

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-primary rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaDatabase />
                    </div>
                    <div>
                        <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">{t('admin_fields.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5">{t('admin_fields.tab.subtitle')} ({logic.fields.length})</p>
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={logic.handleAddNew}>
                    <FaPlus className="text-xs" /> {t('admin_fields.btn.add')}
                </Button>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
                {logic.isLoading && logic.fields.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-textMuted text-xs">
                        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                        <div>{t('common.loading')}</div>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={logic.fields}
                        emptyMessage={t('admin_fields.table.empty')}
                        rowClassName={(row: any) => !row.is_active ? 'opacity-50 bg-main' : ''}
                    />
                )}
            </div>

            <BaseModal isOpen={logic.isModalOpen} onClose={() => logic.setIsModalOpen(false)} title={logic.isEditing ? t('admin_fields.modal.title_edit') : t('admin_fields.modal.title_add')} maxWidth="680px" actions={modalActions}>
                <form id="fieldForm" onSubmit={logic.handleSubmit} className="p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormGroup label={t('admin_fields.modal.field_code')} className="mb-0">
                            <Input required type="text" name="field_code" value={logic.formData.field_code} onChange={logic.handleInputChange} disabled={logic.isEditing} className="font-mono text-xs h-9" />
                        </FormGroup>
                        <FormGroup label={t('admin_fields.modal.admin_label')} className="mb-0">
                            <Input required type="text" name="admin_label" value={logic.formData.admin_label} onChange={logic.handleInputChange} className="h-9 text-xs" />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormGroup label={t('admin_fields.modal.icon')} className="mb-0">
                            <Input required type="text" name="icon" value={logic.formData.icon} onChange={logic.handleInputChange} className="h-9 text-xs" />
                        </FormGroup>
                        <FormGroup label={t('admin_fields.modal.ui_group')} className="mb-0">
                            <CustomSelect
                                options={logic.groupOptions}
                                value={logic.formData.ui_group}
                                onChange={(val) => logic.handleSelectChange('ui_group', val)}
                                size="sm"
                            />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormGroup label={t('admin_fields.modal.data_type')} className="mb-0">
                            <CustomSelect
                                options={logic.dataTypeOptions}
                                value={logic.formData.data_type}
                                onChange={(val) => logic.handleSelectChange('data_type', val)}
                                size="sm"
                            />
                        </FormGroup>
                        <FormGroup label={t('admin_fields.modal.source_type')} className="mb-0">
                            <CustomSelect
                                options={logic.sourceTypeOptions}
                                value={logic.formData.source_type}
                                onChange={(val) => logic.handleSelectChange('source_type', val)}
                                size="sm"
                            />
                        </FormGroup>
                    </div>

                    <div className="flex flex-wrap gap-4 p-3 bg-main/60 rounded-lg border border-border text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_active" checked={logic.formData.is_active} onChange={logic.handleInputChange} className="accent-primary" />
                            <span className="font-medium text-textMain">{t('admin_fields.modal.is_active')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_visible_table" checked={logic.formData.is_visible_table} onChange={logic.handleInputChange} className="accent-primary" />
                            <span className="font-medium text-textMain">{t('admin_fields.modal.visible_table')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="is_visible_form" checked={logic.formData.is_visible_form} onChange={logic.handleInputChange} className="accent-primary" />
                            <span className="font-medium text-textMain">{t('admin_fields.modal.visible_form')}</span>
                        </label>
                    </div>

                    <FormGroup
                        label={
                            <span className="flex items-center justify-between w-full">
                                <span className="flex items-center gap-1">
                                    <FaCode className="text-primary text-xs"/>
                                    {t('admin_fields.modal.parser_config')}
                                </span>
                                {logic.jsonError && <span className="text-danger font-mono text-[10px]">{logic.jsonError}</span>}
                            </span>
                        }
                        className="mb-0"
                    >
                        <textarea
                            name="parser_config"
                            value={logic.formData.parser_config}
                            onChange={logic.handleInputChange}
                            rows={6}
                            className={`w-full border rounded-lg p-2.5 font-mono text-xs outline-none bg-main text-textMain focus:bg-surface focus:border-primary transition-colors ${logic.jsonError ? 'border-danger' : 'border-border'}`}
                            spellCheck="false"
                        />
                    </FormGroup>
                </form>
            </BaseModal>
        </div>
    );
}