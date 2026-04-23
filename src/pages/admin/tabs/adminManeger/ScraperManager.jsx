import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaEdit, FaTrash, FaRobot } from 'react-icons/fa';
import DataTable from '../../ui/DataTable';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Badge } from '../../ui/Badge';
import { useModals } from '../../ui/ModalContext';

export default function ScraperManager() {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const [rules, setRules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
    const [formData, setFormData] = useState(initialForm);

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

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const parsedValue = (type === 'number') ? Number(value) : value;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : parsedValue });
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

    const handleDelete = async (id) => {
        showConfirm(
            t('common.confirm_delete_title'),
            t('common.confirm_delete'),
            async () => {
                try {
                    const { error } = await supabase.from('scraper_rules').delete().eq('id', id);
                    if (error) throw error;
                    fetchRules();
                    showAlert(t('common.success'), t('admin_scraper.alerts.deleted'), 'success');
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
                const { error } = await supabase.from('scraper_rules').update(formData).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('scraper_rules').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchRules();
            showAlert(t('common.success'), t('common.save_success'), 'success');
        } catch (error) {
            showAlert(t('common.error'), error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const columns = useMemo(() => [
        { 
            header: `${t('admin_scraper.table.country')} / ${t('admin_scraper.table.platform')}`, 
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Badge variant="primary">{row.country_code}</Badge>
                    <span className="font-bold text-textMain capitalize">{row.platform}</span>
                </div>
            ) 
        },
        { 
            header: t('admin_scraper.table.type'), 
            render: (row) => (
                <Badge variant="purple">
                    {row.type === 'sale' ? t('admin_scraper.type.sale') : t('admin_scraper.type.rent')}
                </Badge>
            )
        },
        { 
            header: t('admin_scraper.table.price_limits'), 
            render: (row) => (
                <span className="font-mono text-[0.85rem] bg-main px-2 py-1 rounded-md border border-border text-textMuted shadow-sm whitespace-nowrap">
                    {row.min_price} - {row.max_price}
                </span>
            )
        },
        { 
            header: t('admin_scraper.table.status'), 
            render: (row) => row.is_active ? <Badge variant="success">{t('admin_scraper.status.active')}</Badge> : <Badge variant="default">{t('admin_scraper.status.inactive')}</Badge> 
        },
        { 
            header: t('admin_scraper.table.actions'), 
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(row)} className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-primary/10 hover:text-primary shadow-sm"><FaEdit size={12} /></button>
                    <button onClick={() => handleDelete(row.id)} className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 shadow-sm"><FaTrash size={12} /></button>
                </div>
            )
        }
    ], [t]);

    const modalActions = (
        <>
            <Button variant="cancel" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="!border-transparent">
                {t('common.cancel')}
            </Button>
            <Button type="submit" form="scraperForm" variant="primary" disabled={isLoading} className="shadow-md !bg-[#8b5cf6] hover:!bg-[#7c3aed]">
                {isLoading ? t('common.saving') : t('common.save')}
            </Button>
        </>
    );

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-purple-500/10 text-[#8b5cf6] rounded-2xl border border-purple-500/20 flex items-center justify-center text-[1.5rem] shadow-inner">
                        <FaRobot />
                    </div>
                    <div>
                        <h2 className="m-0 text-[1.5rem] text-textMain font-extrabold tracking-tight">{t('admin_scraper.tab.title')}</h2>
                        <p className="m-0 text-textMuted text-[0.95rem] font-medium mt-1">{t('admin_scraper.tab.subtitle')}</p>
                    </div>
                </div>
                
                <Button variant="primary" onClick={handleAddNew} className="w-full sm:w-auto shadow-md relative z-10 !bg-[#8b5cf6] hover:!bg-[#7c3aed] !px-6">
                    <FaPlus className="mr-2" /> {t('admin_scraper.btn.add')}
                </Button>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={rules} 
                    emptyMessage={t('admin_scraper.table.empty')}
                    rowClassName={(row) => !row.is_active ? 'opacity-60 bg-main' : ''}
                />
            </div>

            <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? t('admin_scraper.modal.title_edit') : t('admin_scraper.modal.title_add')} maxWidth="700px" actions={modalActions}>
                <form id="scraperForm" onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormGroup label={t('admin_scraper.modal.country')} className="mb-0">
                            <Input required type="text" name="country_code" value={formData.country_code} onChange={handleInputChange} className="!uppercase" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.platform')} className="mb-0">
                            <Input required type="text" name="platform" value={formData.platform} onChange={handleInputChange} />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.type')} className="mb-0">
                            <Select required name="type" value={formData.type} onChange={handleInputChange}>
                                <option value="sale">{t('admin_scraper.type.sale')}</option>
                                <option value="rent">{t('admin_scraper.type.rent')}</option>
                            </Select>
                        </FormGroup>
                    </div>

                    <FormGroup label={t('admin_scraper.modal.selector')} className="mb-0">
                        <Input required type="text" name="item_selector" value={formData.item_selector} onChange={handleInputChange} className="!font-mono !text-[0.85rem]" />
                    </FormGroup>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormGroup label={t('admin_scraper.modal.price_regex')} className="mb-0">
                            <Input required type="text" name="price_regex" value={formData.price_regex} onChange={handleInputChange} className="!font-mono !text-[0.85rem]" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.sqm_regex')} className="mb-0">
                            <Input required type="text" name="sqm_regex" value={formData.sqm_regex} onChange={handleInputChange} className="!font-mono !text-[0.85rem]" />
                        </FormGroup>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-main p-5 rounded-xl border border-border shadow-inner">
                        <FormGroup label={t('admin_scraper.modal.min_price')} className="mb-0">
                            <Input required type="number" name="min_price" value={formData.min_price} onChange={handleInputChange} className="!bg-surface" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.max_price')} className="mb-0">
                            <Input required type="number" name="max_price" value={formData.max_price} onChange={handleInputChange} className="!bg-surface" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.min_sqm')} className="mb-0">
                            <Input required type="number" name="min_sqm" value={formData.min_sqm} onChange={handleInputChange} className="!bg-surface" />
                        </FormGroup>
                        <FormGroup label={t('admin_scraper.modal.max_sqm')} className="mb-0">
                            <Input required type="number" name="max_sqm" value={formData.max_sqm} onChange={handleInputChange} className="!bg-surface" />
                        </FormGroup>
                    </div>

                    <div className="mt-2">
                        <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-pointer hover:border-[#8b5cf6] transition-colors shadow-sm w-max">
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-5 h-5 accent-[#8b5cf6] cursor-pointer" />
                            <span className="text-[0.95rem] font-bold text-textMain">{t('admin_scraper.modal.is_active')}</span>
                        </label>
                    </div>
                </form>
            </BaseModal>
        </div>
    );
}