import React, { useState, useEffect } from 'react';
import { FaTag, FaPlus } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import DataTable from '../../ui/DataTable'; 
import uiStyles from '../../ui/AdminUI.module.css';

const PromoCodesModal = ({ isOpen, onClose, adminUsersAPI, t }) => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [percentOff, setPercentOff] = useState(20);
    const [duration, setDuration] = useState('once');

    useEffect(() => {
        if (isOpen) fetchCodes();
    }, [isOpen]);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const res = await adminUsersAPI.manageFinance('list_promos');
            setCodes(res.codes || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCode || percentOff < 1) return;
        setCreating(true);
        try {
            await adminUsersAPI.manageFinance('create_promo', {
                code: newCode.toUpperCase(),
                percentOff: parseInt(percentOff),
                duration: duration
            });
            setNewCode('');
            await fetchCodes();
        } catch (err) {
            alert('Error creating promo code: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    const modalTitle = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTag style={{ color: 'var(--primary)' }} /> 
            <span>{t('usersTab.promoModal.title')}</span>
        </div>
    );

    const tableColumns = [
        { header: t('usersTab.promoModal.colCode'), render: (c) => <span style={{ fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.05em' }}>{c.code}</span> },
        { header: t('usersTab.promoModal.colDiscount'), render: (c) => <span style={{ fontWeight: '600', color: 'var(--success)'}}>{c.coupon?.percent_off}%</span> },
        { header: t('usersTab.promoModal.colDuration'), render: (c) => <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{c.coupon?.duration}</span> },
        { header: t('usersTab.promoModal.colUses'), render: (c) => <span style={{ fontWeight: '600' }}>{c.times_redeemed}</span> }
    ];

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="700px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '16px', 
                    alignItems: 'flex-end', 
                    background: 'var(--bg-main)', 
                    padding: '20px', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px solid var(--border)' 
                }}>
                    <div style={{ flex: '2 1 200px' }} className={uiStyles.formGroup}>
                        <label className={uiStyles.label}>{t('usersTab.promoModal.codeLabel')}</label>
                        <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="SALE50" className={uiStyles.input} />
                    </div>
                    <div style={{ flex: '1 1 100px' }} className={uiStyles.formGroup}>
                        <label className={uiStyles.label}>{t('usersTab.promoModal.offLabel')}</label>
                        <input type="number" min="1" max="100" value={percentOff} onChange={e => setPercentOff(e.target.value)} className={uiStyles.input} />
                    </div>
                    <div style={{ flex: '2 1 200px' }} className={uiStyles.formGroup}>
                        <label className={uiStyles.label}>{t('usersTab.promoModal.durationLabel')}</label>
                        <select value={duration} onChange={e => setDuration(e.target.value)} className={uiStyles.input}>
                            <option value="once">{t('usersTab.promoModal.once')}</option>
                            <option value="repeating">{t('usersTab.promoModal.repeating')}</option>
                            <option value="forever">{t('usersTab.promoModal.forever')}</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} disabled={creating || !newCode} className={`${uiStyles.btn} ${uiStyles.btnPrimary}`} style={{ flex: '1 1 120px', height: '44px' }}>
                        {creating ? t('usersTab.promoModal.adding') : <><FaPlus /> {t('usersTab.promoModal.addBtn')}</>}
                    </button>
                </div>

                <div>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '700' }}>
                        {t('usersTab.promoModal.activeTitle')}
                    </h4>
                    {loading ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                            {t('usersTab.promoModal.loading')}
                        </div>
                    ) : (
                        <DataTable 
                            columns={tableColumns} 
                            data={codes} 
                            emptyMessage={t('usersTab.promoModal.empty')} 
                        />
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default React.memo(PromoCodesModal);