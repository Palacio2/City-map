import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useModals } from '@admin/core/context/ModalContext';
import { adminFieldsApi } from '@admin/features/fields/adminFieldsApi';
import { SelectOption } from '@admin/core/ui/CustomSelect';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { FieldConfigItem, FieldGroupItem } from '@admin/core/types/schemas.types';

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

export type FieldFormData = typeof initialForm & { id?: string | number };

export function useFieldsManager() {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const { withLogging } = useActionLogger();
    const [fields, setFields] = useState<FieldConfigItem[]>([]);
    const [groups, setGroups] = useState<FieldGroupItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<FieldFormData>(initialForm);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fieldsData, groupsData] = await Promise.all([
                adminFieldsApi.getFields(),
                adminFieldsApi.getGroups()
            ]);
            setFields(fieldsData || []);
            setGroups(groupsData || []);
        } catch (error: unknown) {
            console.error("Fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        if (name === 'parser_config') {
            try {
                JSON.parse(value);
                setJsonError(null);
            } catch {
                setJsonError(t('admin_fields.modal.json_error'));
            }
        }
    };

    const handleSelectChange = (name: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = (item: FieldConfigItem | FieldFormData) => {
        const parsedConfig = typeof item.parser_config === 'object' && item.parser_config !== null
            ? JSON.stringify(item.parser_config, null, 2)
            : (typeof item.parser_config === 'string' ? item.parser_config : '');

        setFormData({
            id: item.id,
            field_code: item.field_code,
            admin_label: item.admin_label,
            icon: item.icon,
            data_type: item.data_type,
            ui_group: item.ui_group,
            source_type: item.source_type,
            ui_component: item.ui_component || 'input_number',
            is_visible_table: item.is_visible_table,
            is_visible_form: item.is_visible_form,
            sort_order: item.sort_order,
            is_active: item.is_active,
            parser_config: parsedConfig
        });
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
                    await withLogging('delete_field', () => adminFieldsApi.deleteField(id), { id });
                    fetchData();
                    showAlert(t('common.success'), t('admin_fields.field_deleted'), 'success');
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
        if (jsonError) return;
        setIsLoading(true);
        try {
            const payload: Record<string, unknown> = { ...formData };
            if (typeof payload.parser_config === 'string') {
                try { payload.parser_config = JSON.parse(payload.parser_config); }
                catch { payload.parser_config = {}; }
            }
            if (isEditing && formData.id) {
                await withLogging('update_field', () => adminFieldsApi.updateField(String(formData.id), payload), { id: formData.id, payload });
            } else {
                await withLogging('insert_field', () => adminFieldsApi.insertField(payload), { payload });
            }
            setIsModalOpen(false);
            fetchData();
            showAlert(t('common.success'), t('common.save_success'), 'success');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error';
            showAlert(t('common.error'), msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const groupOptions: SelectOption[] = [
        { value: '', label: t('common.select_option') },
        ...groups.map(g => ({ value: String(g.id || ''), label: String(g.label_key || '') }))
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