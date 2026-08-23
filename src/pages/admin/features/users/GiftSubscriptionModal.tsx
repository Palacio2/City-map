import { useState } from 'react';
import { FaGift, FaCrown, FaUserShield } from 'react-icons/fa';
import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { Input, FormGroup } from '@admin/core/ui/Input';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';

interface GiftSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: { id: string; email: string; [key: string]: unknown } | null;
    onGrant: (userId: string, planName: string, days: number) => Promise<unknown>;
    onRevoke?: (userId: string) => Promise<unknown>;
    t: (key: string, options?: Record<string, unknown>) => string;
}

const GiftSubscriptionModal = ({ isOpen, onClose, selectedUser, onGrant, onRevoke, t }: GiftSubscriptionModalProps) => {
    const [planName, setPlanName] = useState('premium');
    const [days, setDays] = useState<number | string>(30);
    const [loading, setLoading] = useState(false);
    const [revoking, setRevoking] = useState(false);

    if (!isOpen || !selectedUser) return null;

    const planOptions: SelectOption[] = [
        { 
            value: 'premium', 
            label: t('admin_users.plans.premium'), 
            icon: <FaCrown className="text-primary text-xs" />,
            description: t('admin_users.plans.premium_desc')
        },
        { 
            value: 'realtor', 
            label: t('admin_users.plans.realtor'), 
            icon: <FaUserShield className="text-emerald-600 text-xs" />,
            description: t('admin_users.plans.realtor_desc')
        }
    ];

    const presetDays = [7, 30, 90, 365];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onGrant(selectedUser.id, planName, Number(days));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async () => {
        if (!onRevoke) return;
        setRevoking(true);
        try {
            await onRevoke(selectedUser.id);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setRevoking(false);
        }
    };

    const modalTitle = (
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center text-xs">
                <FaGift />
            </div>
            <span className="text-sm font-bold text-textMain">{t('admin_users.gift_modal.title')}</span>
        </div>
    );

    const modalActions = (
        <>
            {onRevoke && (
                <Button variant="danger" size="sm" onClick={handleRevoke} disabled={loading || revoking} className="mr-auto">
                    {revoking ? '...' : t('admin_users.gift_modal.revoke', 'Скасувати')}
                </Button>
            )}
            <Button variant="cancel" size="sm" onClick={onClose} disabled={loading || revoking}>
                {t('admin_users.gift_modal.cancel')}
            </Button>
            <Button variant="success" size="sm" onClick={handleSubmit} disabled={loading || revoking || Number(days) < 1}>
                {loading ? t('admin_users.gift_modal.granting') : <><FaGift /> {t('admin_users.gift_modal.grant_btn')}</>}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="440px" actions={modalActions}>
            <div className="flex flex-col gap-4">
                <div className="bg-main/50 p-3.5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] text-xs text-textMain leading-relaxed font-medium">
                    {t('admin_users.gift_modal.desc')} <strong className="text-emerald-600 font-bold">{selectedUser.email}</strong>.
                </div>

                <FormGroup label={t('admin_users.gift_modal.plan_label')} className="mb-0">
                    <CustomSelect
                        options={planOptions}
                        value={planName}
                        onChange={(val) => setPlanName(String(val))}
                    />
                </FormGroup>

                <FormGroup label={t('admin_users.gift_modal.days_label')} className="mb-0">
                    <Input
                        type="number" 
                        min="1" 
                        max="365"
                        value={days}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDays(e.target.value)}
                        className="h-9 font-mono font-bold text-xs"
                    />
                    
                    <div className="flex gap-1.5 mt-2">
                        {presetDays.map(preset => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setDays(preset)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                                    Number(days) === preset 
                                        ? 'bg-primary-subtle border-primary/30 text-primary' 
                                        : 'bg-surface border-[#d6ccbf] dark:border-[#4a3f37] hover:bg-hover text-textMuted'
                                }`}
                            >
                                +{preset}д
                            </button>
                        ))}
                    </div>
                </FormGroup>
            </div>
        </BaseModal>
    );
};

export default GiftSubscriptionModal;