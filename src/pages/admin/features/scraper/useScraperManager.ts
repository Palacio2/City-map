// src/pages/admin/features/scraper/useScraperManager.ts
import { useTranslation } from 'react-i18next';
import { adminScraperApi } from '@admin/features/scraper/adminScraperApi';
import { useCrudManager } from '@admin/core/hooks/useCrudManager';
import { SelectOption } from '@admin/core/ui/CustomSelect';
import { ScraperRule } from './types';

const initialForm = {
    country_code: 'PL',
    platform: 'otodom',
    type: 'sale',
    item_selector: 'article',
    price_regex: '',
    sqm_regex: '',
    min_price: 0,
    max_price: 999999999,
    min_sqm: 0,
    max_sqm: 99999,
    is_active: true
};

export type ScraperRuleForm = typeof initialForm & { id?: string | number };

export function useScraperManager() {
    const { t } = useTranslation('db');

    const crud = useCrudManager<ScraperRuleForm>({
        queryKey: ['scraperRules'],
        fetchFn: async () => {
            const rules = await adminScraperApi.getRules();
            return rules as unknown as ScraperRuleForm[];
        },
        createFn: adminScraperApi.insertRule,
        updateFn: adminScraperApi.updateRule,
        deleteFn: adminScraperApi.deleteRule,
        initialForm,
        entityName: 'scraper_rule'
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const parsedValue = (type === 'number') ? Number(value) : value;
        crud.setFormData({ ...crud.formData, [name]: type === 'checkbox' ? checked : parsedValue });
    };

    const handleSelectChange = (name: string, value: unknown) => {
        crud.setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (item: ScraperRule | ScraperRuleForm) => {
        crud.handleEdit(item as ScraperRuleForm);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        crud.saveMutation.mutate(crud.formData);
    };

    const typeOptions: SelectOption[] = [
        { value: 'sale', label: t('admin_scraper.type.sale') },
        { value: 'rent', label: t('admin_scraper.type.rent') }
    ];

    return {
        t,
        rules: crud.items,
        isModalOpen: crud.isModalOpen,
        setIsModalOpen: crud.setIsModalOpen,
        isLoading: crud.isLoading || crud.saveMutation.isPending,
        isEditing: crud.isEditing,
        formData: crud.formData,
        typeOptions,
        handleInputChange,
        handleSelectChange,
        handleEdit,
        handleAddNew: crud.handleAddNew,
        handleDelete: crud.handleDelete,
        handleSubmit
    };
}