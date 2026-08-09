import { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { useModals } from '../ui/ModalContext';
import { SelectOption } from '../ui/CustomSelect';

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

export function useFieldsManager() {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const [fields, setFields] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>(initialForm);
    const [jsonError, setJsonError] = useState<string | null>(null);

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
        } catch (error: any) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
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

    const handleSelectChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleEdit = (item: any) => {
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

    const handleDelete = (id: string | number) => {
        showConfirm(
            t('common.confirm_delete_title'),
            t('common.confirm_delete'),
            async () => {
                try {
                    const { error } = await supabase.from('fields_config').delete().eq('id', String(id));
                    if (error) throw error;
                    fetchData();
                    showAlert(t('common.success'), 'Поле видалено', 'success');
                } catch (error: any) {
                    showAlert(t('common.error'), error.message, 'error');
                }
            },
            { confirmVariant: 'danger' }
        );
    };

    const handleSubmit = async (e: any) => {
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
            showAlert(t('common.success'), t('common.save_success'), 'success');
        } catch (error: any) {
            showAlert(t('common.error'), error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const groupOptions: SelectOption[] = [
        { value: '', label: t('common.select_option') },
        ...groups.map(g => ({ value: g.id, label: g.label_key }))
    ];

    const dataTypeOptions: SelectOption[] = [
        { value: 'integer', label: t('admin_fields.options.integer') },
        { value: 'numeric', label: t('admin_fields.options.numeric') },
        { value: 'boolean', label: t('admin_fields.options.boolean') },
        { value: 'text', label: t('admin_fields.options.text') }
    ];

    const sourceTypeOptions: SelectOption[] = [
        { value: 'osm', label: 'OSM PBF' },
        { value: 'scraper', label: t('admin_fields.options.scraper') },
        { value: 'api', label: t('admin_fields.options.api') },
        { value: 'gus', label: t('admin_fields.options.gus') },
        { value: 'manual', label: t('admin_fields.options.manual') }
    ];

    return {
        t,
        fields,
        groups,
        isModalOpen,
        setIsModalOpen,
        isLoading,
        isEditing,
        formData,
        jsonError,
        groupOptions,
        dataTypeOptions,
        sourceTypeOptions,
        handleInputChange,
        handleSelectChange,
        handleEdit,
        handleAddNew,
        handleDelete,
        handleSubmit
    };
}
