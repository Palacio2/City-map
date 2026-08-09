import { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { useModals } from '../ui/ModalContext';
import { SelectOption } from '../ui/CustomSelect';

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

export function useScraperManager() {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const [rules, setRules] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>(initialForm);

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('scraper_rules').select('*').order('created_at');
            if (error) throw error;
            setRules(data || []);
        } catch (error) {
            console.error("Load error:", error);
            showAlert(t('common.error'), t('admin_scraper.errors.load_fail'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        const parsedValue = (type === 'number') ? Number(value) : value;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : parsedValue });
    };

    const handleSelectChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
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

    const handleDelete = (id: string | number) => {
        showConfirm(
            t('common.confirm_delete_title'),
            t('common.confirm_delete'),
            async () => {
                try {
                    const { error } = await supabase.from('scraper_rules').delete().eq('id', String(id));
                    if (error) throw error;
                    fetchRules();
                    showAlert(t('common.success'), t('admin_scraper.alerts.deleted'), 'success');
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
                const { error } = await supabase.from('scraper_rules').update(formData).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('scraper_rules').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchRules();
            showAlert(t('common.success'), t('common.save_success'), 'success');
        } catch (error: any) {
            showAlert(t('common.error'), error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const typeOptions: SelectOption[] = [
        { value: 'sale', label: t('admin_scraper.type.sale') },
        { value: 'rent', label: t('admin_scraper.type.rent') }
    ];

    return {
        t,
        rules,
        isModalOpen,
        setIsModalOpen,
        isLoading,
        isEditing,
        formData,
        typeOptions,
        handleInputChange,
        handleSelectChange,
        handleEdit,
        handleAddNew,
        handleDelete,
        handleSubmit
    };
}
