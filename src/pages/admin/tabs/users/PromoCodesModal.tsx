import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTag, FaPlus, FaTrash, FaPercent } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { CustomSelect, SelectOption } from '../../ui/CustomSelect';
import { useModals } from '../../ui/ModalContext';

const PromoCodesModal = ({ isOpen, onClose, adminUsersAPI, t }: any) => {
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
            queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
            showAlert(t('common.success'), t('admin_users.promo_modal.created'), 'success');
        },
        onError: (err: any) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (promoId: string) => adminUsersAPI.manageFinance('delete_promo', { id: promoId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['promoCodes'] });
            showAlert(t('common.success'), t('admin_users.promo_modal.deleted'), 'success');
        },
        onError: (err: any) => showAlert(t('common.error'), err.message, 'error')
    });

    const handleCreate = () => {
        if (!newCode || percentOff < 1) return;
        createMutation.mutate();
    };

    const handleDelete = (promoId: string, codeName: string) => {
        showConfirm(
            t('admin_users.promo_modal.delete_title'),
            t('admin_users.promo_modal.delete_confirm', { code: codeName, defaultValue: `Ви дійсного хочете видалити промокод ${codeName}?` }),
            () => {
                deleteMutation.mutate(promoId);
            },
            { confirmText: t('admin_users.promo_modal.delete_btn'), confirmVariant: 'danger' }
        );
    };

    const tableColumns = [
        { 
            header: t('admin_users.promo_modal.col_code'), 
            render: (c: any) => (
                <span className="font-mono font-semibold text-primary bg-primary-subtle px-2 py-1 rounded border border-primary/20 text-xs tracking-wide">
                    {c.code}
                </span>
            ) 
        },
        { 
            header: t('admin_users.promo_modal.col_discount'), 
            render: (c: any) => (
                <span className="inline-flex items-center gap-1 font-medium text-success bg-success-subtle px-2 py-0.5 rounded text-xs">
                    <FaPercent className="text-[9px]" /> {c.coupon?.percent_off}%
                </span>
            ) 
        },
        { 
            header: t('admin_users.promo_modal.col_duration'), 
            render: (c: any) => <span className="text-textMuted font-mono uppercase text-[11px]">{c.coupon?.duration}</span> 
        },
        { 
            header: t('admin_users.promo_modal.col_uses'), 
            render: (c: any) => <span className="font-mono text-textMain">{c.times_redeemed}</span> 
        },
        { 
            header: '', 
            render: (c: any) => (
                <div className="flex justify-end">
                    <button
                        onClick={() => handleDelete(c.id, c.code)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors"
                        title={t('admin_users.promo_modal.delete_btn')}
                    >
                        <FaTrash className="text-xs" />
                    </button>
                </div>
            )
        }
    ];

    const modalTitle = (
        <div className="flex items-center gap-2">
            <FaTag className="text-primary text-sm" />
            <span className="text-sm font-semibold text-textMain">{t('admin_users.promo_modal.title')}</span>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="660px">
            <div className="flex flex-col gap-5 p-4">
                <div className="bg-main/60 p-3.5 rounded-xl border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4 flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-textMuted">{t('admin_users.promo_modal.code_label')}</label>
                        <Input
                            type="text"
                            placeholder="SUMMER2026"
                            value={newCode}
                            onChange={(e: any) => setNewCode(e.target.value.toUpperCase())}
                            className="uppercase font-mono font-medium h-9 text-xs bg-surface border-border focus:border-primary shadow-2xs"
                            disabled={createMutation.isPending}
                        />
                    </div>

                    <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-textMuted">{t('admin_users.promo_modal.off_label')}</label>
                        <Input
                            type="number" 
                            min="1" 
                            max="100"
                            value={percentOff}
                            onChange={(e: any) => setPercentOff(e.target.value)}
                            className="font-mono h-9 text-xs bg-surface border-border focus:border-primary shadow-2xs"
                            disabled={createMutation.isPending}
                        />
                    </div>

                    <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-textMuted">{t('admin_users.promo_modal.duration_label')}</label>
                        <CustomSelect
                            options={durationOptions}
                            value={duration}
                            onChange={(val) => setDuration(val)}
                            disabled={createMutation.isPending}
                        />
                    </div>

                    <div className="sm:col-span-2 flex flex-col justify-end">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleCreate}
                            disabled={createMutation.isPending || !newCode}
                            className="w-full h-9"
                        >
                            {createMutation.isPending ? '...' : <><FaPlus className="text-xs" /> Додати</>}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <h4 className="m-0 text-xs font-semibold text-textMain">
                        {t('admin_users.promo_modal.active_title')}
                    </h4>
                    {loading ? (
                        <div className="text-center p-8 text-xs text-textMuted">
                            {t('common.loading')}
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
        </BaseModal>
    );
};

export default PromoCodesModal;