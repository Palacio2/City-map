import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTag, FaPlus, FaTrash, FaPercent } from 'react-icons/fa';
import BaseModal from '@admin/core/ui/BaseModal';
import DataTable from '@admin/core/ui/DataTable';
import { Button } from '@admin/core/ui/Button';
import { Input } from '@admin/core/ui/Input';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';
import { useModals } from '@admin/core/context/ModalContext';
import { AdminUsersAPI } from './types';

interface PromoCodesModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminUsersAPI: AdminUsersAPI;
    t: (key: string, options?: Record<string, unknown>) => string;
}

const PromoCodesModal = ({ isOpen, onClose, adminUsersAPI, t }: PromoCodesModalProps) => {
    const { showAlert, showConfirm } = useModals();
    const queryClient = useQueryClient();
    const [newCode, setNewCode] = useState('');
    const [percentOff, setPercentOff] = useState(20);
    const [duration, setDuration] = useState('once');

    const durationOptions: SelectOption[] = [
        { value: 'once', label: t('admin_users.promo_modal.once') },
        { value: 'repeating', label: t('admin_users.promo_modal.repeating') },
        { value: 'forever', label: t('admin_users.promo_modal.forever') }
    ];

    const { data: codes = [], isLoading: loading } = useQuery({
        queryKey: ['promoCodes'],
        queryFn: async () => {
            const res = await adminUsersAPI.manageFinance('list_promos') as { codes?: { id: string; code: string; [key: string]: unknown }[] };
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
            queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
            showAlert(t('common.success'), t('admin_users.promo_modal.created'), 'success');
        },
        onError: (err: Error) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (promoId: string) => adminUsersAPI.manageFinance('delete_promo', { id: promoId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
            showAlert(t('common.success'), t('admin_users.promo_modal.deleted'), 'success');
        },
        onError: (err: Error) => showAlert(t('common.error'), err.message, 'error')
    });

    const handleCreate = () => {
        if (!newCode || percentOff < 1) return;
        createMutation.mutate();
    };

    const handleDelete = (promoId: string, codeName: string) => {
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
        { 
            header: t('admin_users.promo_modal.col_code'), 
            render: (c: { code: string; [key: string]: unknown }) => (
                <div className="flex items-center gap-2">
                    <FaTag className="text-emerald-500/50 text-[10px]" />
                    <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs tracking-wider shadow-2xs">
                        {c.code}
                    </span>
                </div>
            ) 
        },
        { 
            header: t('admin_users.promo_modal.col_discount'), 
            render: (c: { coupon?: { percent_off?: number }; [key: string]: unknown }) => (
                <span className="inline-flex items-center gap-1 font-extrabold text-textMain bg-main/50 px-2.5 py-1 rounded-lg border border-border text-xs">
                    <span className="text-textMuted text-[10px]">%</span> {c.coupon?.percent_off}
                </span>
            ) 
        },
        { 
            header: t('admin_users.promo_modal.col_duration'), 
            render: (c: { coupon?: { duration?: string }; [key: string]: unknown }) => <span className="text-textMuted font-mono font-semibold uppercase text-[10px] tracking-widest bg-main/30 px-2 py-1 rounded-md">{c.coupon?.duration}</span> 
        },
        { 
            header: t('admin_users.promo_modal.col_uses'), 
            render: (c: { times_redeemed?: number; [key: string]: unknown }) => <span className="font-mono font-bold text-textMain text-sm">{c.times_redeemed} <span className="text-[9px] text-textMuted font-sans uppercase ml-0.5">{t('admin_users.promo.times')}</span></span> 
        },
        { 
            header: '', 
            render: (c: { id: string; code: string; [key: string]: unknown }) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => handleDelete(c.id, c.code)}
                        disabled={deleteMutation.isPending}
                        className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-rose-600 hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-30 border border-transparent hover:border-rose-500/30"
                        title={t('admin_users.promo_modal.delete_btn')}
                    >
                        <FaTrash className="text-[11px]" />
                    </button>
                </div>
            )
        }
    ];

    const modalTitle = (
        <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center text-lg">
                <FaTag />
            </div>
            <div className="flex flex-col">
                <h2 className="text-base sm:text-lg font-extrabold text-textMain tracking-tight m-0">
                    {t('admin_users.promo_modal.title')}
                </h2>
                <p className="text-[11px] sm:text-xs font-semibold text-textMuted m-0 mt-0.5">
                    Створюйте знижки для нових користувачів
                </p>
            </div>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="720px">
            <div className="flex flex-col gap-6 font-sans">
                {/* Форма створення нового коду */}
                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex items-center gap-2 text-textMain font-bold text-xs sm:text-sm pl-1">
                        <FaPlus className="text-emerald-500 text-[10px]" />
                        <span>{t('admin_users.promo.new_code')}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
                        <div className="sm:col-span-5 flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-textMuted uppercase tracking-widest pl-1">{t('admin_users.promo_modal.code_label')}</label>
                            <Input
                                type="text"
                                placeholder={t('admin_users.promo.placeholder')}
                                value={newCode}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCode(e.target.value.toUpperCase())}
                                className="uppercase font-mono font-bold h-10 text-xs sm:text-sm bg-surface"
                                disabled={createMutation.isPending}
                            />
                        </div>

                        <div className="sm:col-span-3 flex flex-col gap-1.5 relative">
                            <label className="text-[10px] font-extrabold text-textMuted uppercase tracking-widest pl-1">{t('admin_users.promo_modal.off_label')}</label>
                            <div className="relative">
                                <Input
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    value={percentOff}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPercentOff(Number(e.target.value))}
                                    className="font-mono font-bold h-10 text-xs sm:text-sm bg-surface pl-8"
                                    disabled={createMutation.isPending}
                                />
                                <FaPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted text-[10px]" />
                            </div>
                        </div>

                        <div className="sm:col-span-4 flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-textMuted uppercase tracking-widest pl-1">{t('admin_users.promo_modal.duration_label')}</label>
                            <CustomSelect
                                options={durationOptions}
                                value={duration}
                                onChange={(val) => setDuration(String(val))}
                                disabled={createMutation.isPending}
                                size="md"
                            />
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleCreate}
                        disabled={createMutation.isPending || !newCode}
                        className="w-full h-10 shadow-sm rounded-xl text-sm font-bold mt-1"
                    >
                        {createMutation.isPending ? t('common.creating') : t('admin_users.promo.create_btn')}
                    </Button>
                </div>

                {/* Список активних кодів */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pl-1">
                        <FaTag className="text-textMuted text-[10px]" />
                        <h4 className="m-0 text-[11px] font-extrabold text-textMuted uppercase tracking-widest">
                            {t('admin_users.promo_modal.active_title')}
                        </h4>
                        <span className="bg-main border border-border text-textMain px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                            {codes.length}
                        </span>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto rounded-2xl sm:rounded-3xl border border-border shadow-2xs bg-surface scrollbar-thin">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-10 gap-3 text-textMuted">
                                <div className="w-6 h-6 border-2 border-border border-t-emerald-500 rounded-full animate-spin" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">{t('common.loading')}</span>
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

export default PromoCodesModal;