import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTag, FaPlus, FaTrash } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import DataTable from '../../ui/DataTable'; 
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { useModals } from '../../ui/ModalContext';

const PromoCodesModal = ({ isOpen, onClose, adminUsersAPI, t }) => {
    const { showAlert, showConfirm } = useModals();
    const queryClient = useQueryClient();
    
    const [newCode, setNewCode] = useState('');
    const [percentOff, setPercentOff] = useState(20);
    const [duration, setDuration] = useState('once');

    const { data: codes = [], isLoading: loading } = useQuery({
        queryKey: ['promoCodes'],
        queryFn: async () => {
            const res = await adminUsersAPI.manageFinance('list_promos');
            return res.codes || [];
        },
        enabled: isOpen
    });

    const createMutation = useMutation({
        mutationFn: () => adminUsersAPI.manageFinance('create_promo', {
            code: newCode.toUpperCase(),
            percentOff: Number(percentOff),
            duration: duration
        }),
        onSuccess: () => {
            setNewCode('');
            queryClient.invalidateQueries(['promoCodes']);
            showAlert(t('common.success'), t('admin_users.promo_modal.created'), 'success');
        },
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (promoId) => adminUsersAPI.manageFinance('delete_promo', { id: promoId }),
        onSuccess: () => {
            queryClient.invalidateQueries(['promoCodes']);
            showAlert(t('common.success'), t('admin_users.promo_modal.deleted'), 'success');
        },
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const handleCreate = () => {
        if (!newCode || percentOff < 1) return;
        createMutation.mutate();
    };

    const handleDelete = (promoId, codeName) => {
        showConfirm(
            t('admin_users.promo_modal.delete_title'), 
            t('admin_users.promo_modal.delete_confirm', { code: codeName }), 
            () => {
                deleteMutation.mutate(promoId);
            }, 
            { confirmText: t('admin_users.promo_modal.delete_btn'), confirmVariant: 'danger' }
        );
    };

    const tableColumns = [
        { header: t('admin_users.promo_modal.col_code'), render: (c) => <span className="font-extrabold text-primary bg-blue-500/10 py-1 px-2.5 rounded-md border border-blue-500/20 tracking-wider">{c.code}</span> },
        { header: t('admin_users.promo_modal.col_discount'), render: (c) => <span className="font-bold text-success bg-emerald-500/10 py-1 px-2.5 rounded-md">{c.coupon?.percent_off}%</span> },
        { header: t('admin_users.promo_modal.col_duration'), render: (c) => <span className="text-textMuted font-bold text-[0.85rem] uppercase">{c.coupon?.duration}</span> },
        { header: t('admin_users.promo_modal.col_uses'), render: (c) => <span className="font-semibold text-textMain">{c.times_redeemed}</span> },
        { header: '', render: (c) => (
            <div className="flex justify-end">
                <button 
                    onClick={() => handleDelete(c.id, c.code)}
                    disabled={deleteMutation.isPending}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-transparent text-textMuted hover:bg-red-500/10 hover:text-danger hover:border-red-500/20 transition-all cursor-pointer"
                    title={t('admin_users.promo_modal.delete_btn')}
                >
                    <FaTrash size={12} />
                </button>
            </div>
        )}
    ];

    const modalTitle = (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-primary border border-blue-500/20 flex items-center justify-center">
                <FaTag size={14} /> 
            </div>
            <span>{t('admin_users.promo_modal.title')}</span>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="850px">
            <div className="flex flex-col gap-8 p-2 sm:p-4">
                <div className="bg-surface p-5 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                        <FormGroup label={t('admin_users.promo_modal.code_label')} className="mb-0">
                            <Input 
                                type="text" 
                                placeholder="SUMMER2024" 
                                value={newCode} 
                                onChange={e => setNewCode(e.target.value.toUpperCase())} 
                                className="uppercase font-bold tracking-wider"
                                disabled={createMutation.isPending}
                            />
                        </FormGroup>
                    </div>
                    <div className="md:col-span-3">
                        <FormGroup label={t('admin_users.promo_modal.off_label')} className="mb-0">
                            <Input 
                                type="number" min="1" max="100" 
                                value={percentOff} 
                                onChange={e => setPercentOff(e.target.value)} 
                                className="font-bold text-success"
                                disabled={createMutation.isPending}
                            />
                        </FormGroup>
                    </div>
                    <div className="md:col-span-3">
                        <FormGroup label={t('admin_users.promo_modal.duration_label')} className="mb-0">
                            <Select 
                                value={duration} 
                                onChange={e => setDuration(e.target.value)}
                                disabled={createMutation.isPending}
                            >
                                <option value="once">{t('admin_users.promo_modal.once')}</option>
                                <option value="repeating">{t('admin_users.promo_modal.repeating')}</option>
                                <option value="forever">{t('admin_users.promo_modal.forever')}</option>
                            </Select>
                        </FormGroup>
                    </div>
                    
                    <div className="md:col-span-2">
                        <FormGroup label={<span className="invisible">-</span>} className="mb-0">
                            <Button 
                                variant="primary" 
                                onClick={handleCreate} 
                                disabled={createMutation.isPending || !newCode} 
                                className="w-full !px-0 flex items-center justify-center gap-2 shadow-sm"
                            >
                                {createMutation.isPending ? t('common.loading') : <><FaPlus /> {t('admin_users.promo_modal.add_btn')}</>}
                            </Button>
                        </FormGroup>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="m-0 text-[1.1rem] text-textMain font-extrabold tracking-tight">
                        {t('admin_users.promo_modal.active_title')}
                    </h4>
                    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="text-primary text-center p-10 flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                                <span className="font-bold">{t('common.loading')}</span>
                            </div>
                        ) : (
                            <DataTable 
                                columns={tableColumns} 
                                data={codes} 
                                emptyMessage={t('admin_users.promo_modal.empty')} 
                            />
                        )}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default React.memo(PromoCodesModal);