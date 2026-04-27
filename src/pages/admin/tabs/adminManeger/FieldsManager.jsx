import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaEdit, FaTrash, FaDatabase, FaCode } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Badge } from '../../ui/Badge';

export default function FieldsManager() {
    const { t } = useTranslation('db');
    const [fields, setFields] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialForm = {
        field_code: '', 
        admin_label: '', 
        icon: '📍', 
        data_type: 'integer',
        ui_group: '', 
        source_type: 'osm', 
        parser_config: '{\n  "source": "osm",\n  "osm": {\n    "operator": "OR",\n    "filters": []\n  }\n}',
        ui_component: 'input_number', 
        is_visible_table: true, 
        is_visible_form: true, 
        sort_order: 0,
        is_active: true
    };
    
    const [formData, setFormData] = useState(initialForm);
    const [jsonError, setJsonError] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fieldsRes, groupsRes] = await Promise.all([
                supabase.from('fields_config').select('*').order('sort_order'),
                supabase.from('field_groups').select('*').order('sort_order')
            ]);
            if (fieldsRes.error) throw fieldsRes.error;
            if (groupsRes.error) throw groupsRes.error;
            
            setFields(fieldsRes.data || []);
            setGroups(groupsRes.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });

        if (name === 'parser_config') {
            try { 
                JSON.parse(value); 
                setJsonError(null); 
            } catch (err) { 
                setJsonError(t('admin_fields.modal.json_error')); 
            }
        }
    };

    const handleEdit = (item) => {
        const parsedConfig = typeof item.parser_config === 'object' ? JSON.stringify(item.parser_config, null, 2) : item.parser_config;
        setFormData({ ...item, parser_config: parsedConfig });
        setIsEditing(true);
        setJsonError(null);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setJsonError(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('common.confirm_delete'))) return;
        try {
            const { error } = await supabase.from('fields_config').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (jsonError) return;
        setIsLoading(true);
        
        try {
            const payload = { ...formData };
            if (typeof payload.parser_config === 'string') {
                try { payload.parser_config = JSON.parse(payload.parser_config); } 
                catch (e) { payload.parser_config = {}; }
            }

            if (isEditing) {
                const { error } = await supabase.from('fields_config').update(payload).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('fields_config').insert([payload]);
                if (error) throw error;
            }
            
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const columns = useMemo(() => [
        { 
            header: t('admin_fields.table.code'), 
            render: (row) => <span className="font-bold text-textMain bg-main px-2.5 py-1 border border-border rounded-md text-[0.85rem] font-mono shadow-sm">{row.field_code}</span> 
        },
        { 
            header: t('admin_fields.table.label'), 
            render: (row) => <span className="font-bold text-textMain flex items-center gap-2">{row.icon} {row.admin_label}</span> 
        },
        { 
            header: t('admin_fields.table.group'), 
            render: (row) => {
                const group = groups.find(g => g.id === row.ui_group);
                return <span className="text-textMuted font-medium text-[0.85rem]">{group ? group.label_key : row.ui_group}</span>;
            }
        },
        { 
            header: t('admin_fields.modal.source_type'), 
            render: (row) => (
                <Badge variant={row.source_type === 'osm' ? 'success' : row.source_type === 'gus' ? 'warning' : 'primary'}>
                    {row.source_type.toUpperCase()}
                </Badge>
            )
        },
        { 
            header: t('admin_fields.table.actions'), 
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(row)} className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-primary/10 hover:text-primary shadow-sm"><FaEdit size={12} /></button>
                    <button onClick={() => handleDelete(row.id)} className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 shadow-sm"><FaTrash size={12} /></button>
                </div>
            )
        }
    ], [t, groups]);

    const modalActions = (
        <>
            <Button variant="cancel" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="!border-transparent">
                {t('common.cancel')}
            </Button>
            <Button type="submit" form="fieldForm" variant="primary" disabled={isLoading || !!jsonError} className="shadow-md">
                {isLoading ? t('common.saving') : t('common.save')}
            </Button>
        </>
    );

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-blue-500/10 text-primary rounded-2xl border border-blue-500/20 flex items-center justify-center text-[1.5rem] shadow-inner">
                        <FaDatabase />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.5rem] text-textMain font-extrabold tracking-tight">{t('admin_fields.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-[0.95rem] font-medium mt-1">{t('admin_fields.tab.subtitle')}</p>
                    </div>
                </div>
                <Button variant="primary" onClick={handleAddNew} className="w-full sm:w-auto shadow-md relative z-10 !px-6">
                    <FaPlus /> {t('admin_fields.btn.add')}
                </Button>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                {isLoading && fields.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-4 text-textMuted font-medium text-[1rem]">
                        <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin"></div>
                        {t('common.loading')}
                    </div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={fields} 
                        emptyMessage={t('admin_fields.table.empty')}
                        rowClassName={(row) => !row.is_active ? 'opacity-60 bg-main' : ''}
                    />
                )}
            </div>

            <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('admin_fields.modal.title_edit') : t('admin_fields.modal.title_add')} maxWidth="800px" actions={modalActions}>
                <form id="fieldForm" onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormGroup label={t('admin_fields.modal.field_code')} className="mb-0">
                            <Input required type="text" name="field_code" value={formData.field_code} onChange={handleInputChange} disabled={isEditing} className="!font-mono !text-[0.85rem]" />
                        </FormGroup>
                        <FormGroup label={t('admin_fields.modal.admin_label')} className="mb-0">
                            <Input required type="text" name="admin_label" value={formData.admin_label} onChange={handleInputChange} />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormGroup label={t('admin_fields.modal.icon')} className="mb-0">
                            <Input required type="text" name="icon" value={formData.icon} onChange={handleInputChange} />
                        </FormGroup>
                        <FormGroup label={t('admin_fields.modal.ui_group')} className="mb-0">
                            <Select required name="ui_group" value={formData.ui_group} onChange={handleInputChange}>
                                <option value="">{t('common.select_option')}</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.label_key}</option>)}
                            </Select>
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormGroup label={t('admin_fields.modal.data_type')} className="mb-0">
                            <Select name="data_type" value={formData.data_type} onChange={handleInputChange}>
                                <option value="integer">Integer</option>
                                <option value="numeric">Numeric</option>
                                <option value="boolean">Boolean</option>
                                <option value="text">Text</option>
                            </Select>
                        </FormGroup>
                        <FormGroup label={t('admin_fields.modal.source_type')} className="mb-0">
                            <Select name="source_type" value={formData.source_type} onChange={handleInputChange}>
                                <option value="osm">OSM PBF</option>
                                <option value="scraper">Scraper (Нерухомість)</option>
                                <option value="api">External API (WAQI)</option>
                                <option value="gus">GUS (Макроекономіка)</option>
                                <option value="manual">Manual</option>
                            </Select>
                        </FormGroup>
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-4 p-5 bg-main rounded-xl border border-border shadow-inner">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 accent-primary cursor-pointer" />
                            <span className="text-[0.95rem] font-bold text-textMain group-hover:text-primary transition-colors">{t('admin_fields.modal.is_active')}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" name="is_visible_table" checked={formData.is_visible_table} onChange={handleInputChange} className="w-4 h-4 accent-primary cursor-pointer" />
                            <span className="text-[0.95rem] font-bold text-textMain group-hover:text-primary transition-colors">{t('admin_fields.modal.visible_table')}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" name="is_visible_form" checked={formData.is_visible_form} onChange={handleInputChange} className="w-4 h-4 accent-primary cursor-pointer" />
                            <span className="text-[0.95rem] font-bold text-textMain group-hover:text-primary transition-colors">{t('admin_fields.modal.visible_form')}</span>
                        </label>
                    </div>

                    <FormGroup 
                        label={
                            <span className="flex items-center gap-2">
                                <FaCode className="text-primary"/> 
                                {t('admin_fields.modal.parser_config')}
                                {jsonError && <span className="text-danger ml-auto font-bold text-[0.8rem] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{jsonError}</span>}
                            </span>
                        } 
                        className="mb-0"
                    >
                        <textarea 
                            name="parser_config" 
                            value={formData.parser_config} 
                            onChange={handleInputChange} 
                            rows={8}
                            className={`block w-full border-2 rounded-xl p-4 font-mono text-[0.85rem] outline-none transition-all shadow-inner leading-relaxed ${jsonError ? 'border-red-500 bg-red-500/5 text-danger' : 'border-border bg-main text-[#10b981] focus:bg-surface focus:border-primary'}`}
                            spellCheck="false"
                        />
                        <p className="text-[0.85rem] text-textMuted mt-2 font-medium">{t('admin_fields.modal.parser_config_hint')}</p>
                    </FormGroup>
                </form>
            </BaseModal>
        </div>
    );
}