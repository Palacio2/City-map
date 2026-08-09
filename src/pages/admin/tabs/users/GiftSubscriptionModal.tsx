import { useState } from 'react';
import { FaGift, FaCrown, FaUserShield } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { CustomSelect, SelectOption } from '../../ui/CustomSelect';

const GiftSubscriptionModal = ({ isOpen, onClose, selectedUser, onGrant, t }: any) => {
    const [planName, setPlanName] = useState('premium');
    const [days, setDays] = useState<number | string>(30);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !selectedUser) return null;

    const planOptions: SelectOption[] = [
        { 
            value: 'premium', 
            label: t('admin_users.plans.premium'), 
            icon: <FaCrown className="text-primary text-xs" />,
            description: 'Повний доступ до фільтрів та аналітики'
        },
        { 
            value: 'realtor', 
            label: t('admin_users.plans.realtor'), 
            icon: <FaUserShield className="text-success text-xs" />,
            description: 'Розширені можливості для ріелторів'
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

    const modalTitle = (
        <div className="flex items-center gap-2">
            <FaGift className="text-warning text-sm" />
            <span className="text-sm font-semibold text-textMain">{t('admin_users.gift_modal.title')}</span>
        </div>
    );

    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={onClose} disabled={loading}>
                {t('admin_users.gift_modal.cancel')}
            </Button>
            <Button variant="success" size="sm" onClick={handleSubmit} disabled={loading || Number(days) < 1}>
                {loading ? t('admin_users.gift_modal.granting') : <><FaGift /> {t('admin_users.gift_modal.grant_btn')}</>}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="420px" actions={modalActions}>
            <div className="flex flex-col gap-4 p-4">
                <div className="bg-main p-3 rounded-lg border border-border text-xs text-textMain leading-relaxed font-normal">
                    {t('admin_users.gift_modal.desc')} <strong className="text-success font-semibold">{selectedUser.email}</strong>.
                </div>

                <FormGroup label={t('admin_users.gift_modal.plan_label')} className="mb-0">
                    <CustomSelect
                        options={planOptions}
                        value={planName}
                        onChange={(val) => setPlanName(val)}
                    />
                </FormGroup>

                <FormGroup label={t('admin_users.gift_modal.days_label')} className="mb-0">
                    <Input
                        type="number" 
                        min="1" 
                        max="365"
                        value={days}
                        onChange={(e: any) => setDays(e.target.value)}
                    />
                    
                    
                    <div className="flex gap-1.5 mt-2">
                        {presetDays.map(preset => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setDays(preset)}
                                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                                    Number(days) === preset 
                                        ? 'bg-primary-subtle border-primary/30 text-primary font-medium' 
                                        : 'bg-surface border-border hover:bg-hover text-textMuted'
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