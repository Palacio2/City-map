import React, { useState } from 'react';
import { FaGift } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaGift style={{ color: 'var(--success)' }} /> 
            <span>{t('usersTab.giftModal.title')}</span>
        </div>
    );

    const modalActions = (
        <>
            <button className={`${uiStyles.btn} ${uiStyles.btnCancel}`} onClick={onClose} disabled={loading}>
                {t('usersTab.giftModal.cancel')}
            </button>
            <button className={`${uiStyles.btn} ${uiStyles.btnSuccess}`} onClick={handleSubmit} disabled={loading || days < 1}>
                {loading ? t('usersTab.giftModal.processing') : t('usersTab.giftModal.grantBtn')}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="420px" actions={modalActions}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className={uiStyles.modalSubtitle}>
                    {t('usersTab.giftModal.grantAccessTo')} <strong style={{color: 'var(--success)'}}>{selectedUser.email}</strong>. 
                    {' '}{t('usersTab.giftModal.bypassStripe')}
                </p>
                
                <div className={uiStyles.formGroup}>
                    <label className={uiStyles.label}>{t('usersTab.giftModal.planLabel')}</label>
                    <div className={uiStyles.selectWrapper}>
                        <select value={planName} onChange={e => setPlanName(e.target.value)} className={uiStyles.input}>
                            <option value="premium">{t('usersTab.giftModal.planPremium')}</option>
                            <option value="realtor">{t('usersTab.giftModal.planRealtor')}</option>
                        </select>
                    </div>
                </div>

                <div className={uiStyles.formGroup}>
                    <label className={uiStyles.label}>{t('usersTab.giftModal.daysLabel')}</label>
                    <input 
                        type="number" min="1" max="365" 
                        value={days} 
                        onChange={e => setDays(e.target.value)} 
                        className={uiStyles.input} 
                    />
                    <small style={{color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px'}}>
                        {t('usersTab.giftModal.daysHint')}
                    </small>
                </div>
            </div>
        </BaseModal>
    );
};
 
export default React.memo(GiftSubscriptionModal);