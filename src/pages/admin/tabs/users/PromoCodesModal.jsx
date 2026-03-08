import React, { useState, useEffect } from 'react';
import { FaTag, FaPlus } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import DataTable from '../../ui/DataTable'; // ДОДАНО
import uiStyles from '../../ui/AdminUI.module.css';

const PromoCodesModal = ({ isOpen, onClose, adminUsersAPI }) => {
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
            <span>Stripe Promo Codes</span>
        </div>
    );

    // Використовуємо твій DataTable!
    const tableColumns = [
        { header: 'Code', render: (c) => <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.code}</span> },
        { header: 'Discount', render: (c) => `${c.coupon?.percent_off}%` },
        { header: 'Duration', render: (c) => <span style={{ textTransform: 'capitalize' }}>{c.coupon?.duration}</span> },
        { header: 'Uses', accessor: 'times_redeemed' }
    ];

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="650px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Форма створення */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ flex: '1 1 180px' }} className={uiStyles.formGroup}>
                        <label className={uiStyles.label}>Code (e.g. SALE50)</label>
                        <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code Name" className={uiStyles.input} />
                    </div>
                    <div style={{ flex: '1 1 80px' }} className={uiStyles.formGroup}>
                        <label className={uiStyles.label}>% Off</label>
                        <input type="number" min="1" max="100" value={percentOff} onChange={e => setPercentOff(e.target.value)} className={uiStyles.input} />
                    </div>
                    <div style={{ flex: '1 1 180px' }} className={uiStyles.formGroup}>
                        <label className={uiStyles.label}>Duration</label>
                        <select value={duration} onChange={e => setDuration(e.target.value)} className={uiStyles.input}>
                            <option value="once">Once (1st month)</option>
                            <option value="repeating">Repeating (Every month)</option>
                            <option value="forever">Forever</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} disabled={creating || !newCode} className={`${uiStyles.btn} ${uiStyles.btnPrimary}`} style={{ flex: '1 1 100px', height: '40px' }}>
                        {creating ? '...' : <><FaPlus /> Add</>}
                    </button>
                </div>

                {/* Таблиця промокодів */}
                <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>Active Codes</h4>
                    {loading ? (
                        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
                    ) : (
                        <DataTable 
                            columns={tableColumns} 
                            data={codes} 
                            emptyMessage="No active promo codes found." 
                        />
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default React.memo(PromoCodesModal);