import React, { useState } from 'react';
import { FaGift } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import uiStyles from '../../ui/AdminUI.module.css';

const GiftSubscriptionModal = ({ isOpen, onClose, selectedUser, onGrant }) => {
    const [planName, setPlanName] = useState('premium');
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !selectedUser) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onGrant(selectedUser.id, planName, parseInt(days));
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const modalTitle = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaGift style={{ color: 'var(--success)' }} /> 
            <span>Grant Subscription</span>
        </div>
    );

    const modalActions = (
        <>
            <button className={`${uiStyles.btn} ${uiStyles.btnCancel}`} onClick={onClose} disabled={loading}>
                Cancel
            </button>
            <button className={`${uiStyles.btn} ${uiStyles.btnSuccess}`} onClick={handleSubmit} disabled={loading || days < 1}>
                {loading ? 'Processing...' : 'Grant Access'}
            </button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="400px" actions={modalActions}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className={uiStyles.modalSubtitle}>
                    Grant free access to <strong>{selectedUser.email}</strong>. This bypasses Stripe billing.
                </p>
                
                <div className={uiStyles.formGroup}>
                    <label className={uiStyles.label}>Plan Tier</label>
                    <select value={planName} onChange={e => setPlanName(e.target.value)} className={uiStyles.input}>
                        <option value="premium">Premium</option>
                        <option value="realtor">Realtor Pro</option>
                    </select>
                </div>

                <div className={uiStyles.formGroup}>
                    <label className={uiStyles.label}>Duration (Days)</label>
                    <input 
                        type="number" min="1" max="365" 
                        value={days} 
                        onChange={e => setDays(e.target.value)} 
                        className={uiStyles.input} 
                    />
                </div>
            </div>
        </BaseModal>
    );
};
 
export default React.memo(GiftSubscriptionModal);