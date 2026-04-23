import React, { useState } from 'react';
import { FaGift } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { Select } from '../../ui/Select';

const GiftSubscriptionModal = ({ isOpen, onClose, selectedUser, onGrant, t }) => {
    const [planName, setPlanName] = useState('premium');
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !selectedUser) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onGrant(selectedUser.id, planName, parseInt(days));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-success border border-emerald-500/20 flex items-center justify-center">
                <FaGift size={14} /> 
            </div>
            <span>{t('admin_users.gift_modal.title')}</span>
        </div>
    );

    const modalActions = (
        <>
            <Button variant="cancel" onClick={onClose} disabled={loading} className="!border-transparent !shadow-none">
                {t('admin_users.gift_modal.cancel')}
            </Button>
            <Button variant="success" onClick={handleSubmit} disabled={loading || days < 1} className="!px-6">
                {loading ? t('admin_users.gift_modal.granting') : <><FaGift /> {t('admin_users.gift_modal.grant_btn')}</>}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="450px" actions={modalActions}>
            <div className="flex flex-col gap-5 p-2 sm:p-4">
                <div className="bg-main p-4 rounded-xl border border-border text-[0.95rem] text-textMain leading-relaxed font-medium">
                    {t('admin_users.gift_modal.desc')} <strong className="text-success">{selectedUser.email}</strong>. 
                    {' '}{t('admin_users.gift_modal.bypass_stripe')}
                </div>
                
                <FormGroup label={t('admin_users.gift_modal.plan_label')} className="mb-0">
                    <Select 
                        value={planName} 
                        onChange={e => setPlanName(e.target.value)} 
                    >
                        <option value="premium">{t('admin_users.plans.premium')}</option>
                        <option value="realtor">{t('admin_users.plans.realtor')}</option>
                    </Select>
                </FormGroup>

                <FormGroup label={t('admin_users.gift_modal.days_label')} className="mb-0">
                    <Input 
                        type="number" min="1" max="365" 
                        value={days} 
                        onChange={e => setDays(e.target.value)} 
                        className="!bg-main focus:!bg-surface !rounded-xl"
                    />
                    <small className="text-textMuted font-medium text-[0.8rem] mt-2 block pl-1">
                        {t('admin_users.gift_modal.days_hint')}
                    </small>
                </FormGroup>
            </div>
        </BaseModal>
    );
};

export default React.memo(GiftSubscriptionModal);