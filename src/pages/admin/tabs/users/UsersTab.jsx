import React, { useState, useEffect, useMemo } from 'react';
import { adminUsersAPI } from '@api/adminUsersAPI';
import { supabase } from '@supabaseClient';
import styles from './UsersTab.module.css';
import { FaUserShield, FaCrown, FaHome, FaSearch, FaUserAltSlash, FaUserCheck, FaMapMarkerAlt, FaGift, FaTag } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';

import CityAssignmentModal from './CityAssignmentModal';
import GiftSubscriptionModal from './GiftSubscriptionModal';
import PromoCodesModal from './PromoCodesModal';

export default function UsersTab() {
    const { t } = useTranslation('admin');
    const [users, setUsers] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    
    const [cityModalOpen, setCityModalOpen] = useState(false);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [selectedUserForGift, setSelectedUserForGift] = useState(null);
    const [adminCities, setAdminCities] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchCities();
    }, []);

    const fetchCities = async () => {
        try {
            const { data, error } = await supabase.from('cities').select('id, name').order('name');
            if (error) throw error;
            if (data && Array.isArray(data)) setAvailableCities(data);
        } catch (err) {
            console.error("Failed to fetch cities:", err.message);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminUsersAPI.getUsers();
            setUsers(data.users || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async (userId, currentRole) => {
        if (!window.confirm(t('usersTab.confirmRole', {defaultValue: 'Are you sure?'}))) return;
        try {
            setProcessingId(userId);
            const newRole = (currentRole === 'admin' || currentRole === 'super_admin') ? 'user' : 'admin';
            await adminUsersAPI.updateUser(userId, 'update_role', newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, assigned_cities: [] } : u));
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleRodo = async (userId, currentRodo) => {
        try {
            setProcessingId(userId);
            const newRodo = !currentRodo;
            await adminUsersAPI.updateUser(userId, 'update_rodo', newRodo);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, rodo_accepted: newRodo } : u));
        } catch (err) {
            alert(err.message);
            fetchUsers();
        } finally {
            setProcessingId(null);
        }
    };

    const openCityModal = (user) => {
        setSelectedAdmin(user);
        setAdminCities(user.assigned_cities || []);
        setCityModalOpen(true);
    };

    const toggleCitySelection = (cityId) => {
        setAdminCities(prev => prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]);
    };

    const saveCityAssignments = async () => {
        try {
            setProcessingId(selectedAdmin.id);
            await adminUsersAPI.updateUser(selectedAdmin.id, 'update_cities', adminCities);
            setUsers(prev => prev.map(u => u.id === selectedAdmin.id ? { ...u, assigned_cities: adminCities } : u));
            setCityModalOpen(false);
            setSelectedAdmin(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleGrantSubscription = async (userId, planName, days) => {
        try {
            await adminUsersAPI.manageFinance('grant_subscription', { targetUserId: userId, planName, days });
            alert(`Successfully granted ${planName} for ${days} days!`);
            setGiftModalOpen(false);
            fetchUsers(); 
        } catch (err) {
            alert('Failed to grant: ' + err.message);
        }
    };

    const getRoleBadge = (plan, role) => {
        if (role === 'super_admin') {
            return (
                <span className={styles.badgeSuperAdmin}>
                    <FaCrown /> Super Admin
                </span>
            );
        }
        if (role === 'admin') return <span className={styles.badgeAdmin}><FaUserShield /> Admin</span>;
        if (plan === 'realtor') return <span className={styles.badgeRealtor}><FaHome /> Realtor</span>;
        if (plan === 'premium') return <span className={styles.badgePremium}><FaCrown /> Premium</span>;
        return <span className={styles.badgeBasic}>Basic</span>;
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderSortableHeader = (label, key) => (
        <div 
            onClick={() => handleSort(key)} 
            className={styles.sortableHeader}
            title={`Sort by ${label}`}
        >
            {label}
            <span className={`${styles.sortIcon} ${sortConfig.key === key ? styles.sortIconActive : styles.sortIconInactive}`}>
                {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
            </span>
        </div>
    );

    const processedUsers = useMemo(() => {
        let result = users.filter(user => {
            const term = searchTerm.toLowerCase();
            return user.email?.toLowerCase().includes(term) || user.id.toLowerCase().includes(term);
        });

        result.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === 'role') {
                const weights = { super_admin: 3, admin: 2, user: 1 };
                aValue = weights[a.role] || 0;
                bValue = weights[b.role] || 0;
            }

            if (sortConfig.key === 'plan') {
                const weights = { realtor: 3, premium: 2, basic: 1, free: 1 };
                aValue = weights[a.plan] || 0;
                bValue = weights[b.plan] || 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [users, searchTerm, sortConfig]);

    const columns = [
        { header: t('usersTab.colId', {defaultValue: 'ID'}), render: (user) => <span title={user.id} className={styles.idCell}>{user.id.substring(0, 8)}...</span> },
        { header: renderSortableHeader(t('usersTab.colEmail', {defaultValue: 'Email'}), 'email'), accessor: 'email' },
        { header: renderSortableHeader(t('usersTab.colPlan', {defaultValue: 'Role / Plan'}), 'role'), render: (user) => getRoleBadge(user.plan, user.role) },
        { 
            header: t('usersTab.colCities', { defaultValue: 'Cities' }),
            render: (user) => {
                if (user.role !== 'admin' && user.role !== 'super_admin') return <span className={styles.placeholder}>-</span>;
                const count = user.assigned_cities?.length || 0;
                return (
                    <button onClick={() => openCityModal(user)} className={styles.cityManageBtn} disabled={processingId === user.id}>
                        <FaMapMarkerAlt /> {count > 0 ? `${count} cities` : 'Assign...'}
                    </button>
                );
            }
        },
        { 
            header: t('usersTab.colRodo', {defaultValue: 'RODO'}), 
            render: (user) => (
                <button onClick={() => handleToggleRodo(user.id, user.rodo_accepted)} className={styles.rodoBtn} disabled={processingId === user.id}>
                    {user.rodo_accepted ? <span className={styles.statusYes}>{t('usersTab.yes', {defaultValue: 'Yes'})}</span> : <span className={styles.statusNo}>{t('usersTab.no', {defaultValue: 'No'})}</span>}
                </button>
            ) 
        },
        { 
            header: renderSortableHeader(t('usersTab.colSearches', {defaultValue: 'Searches'}), 'search_count'), 
            render: (user) => <span className={styles.searchCount}><FaSearch /> {user.search_count}</span> 
        },
        { 
            header: renderSortableHeader(t('usersTab.colReg', {defaultValue: 'Reg. Date'}), 'created_at'), 
            render: (user) => new Date(user.created_at).toLocaleDateString('uk-UA') 
        },
        {
            header: t('usersTab.colActions', {defaultValue: 'Actions'}),
            render: (user) => (
                <div className={styles.actionButtons}>
                    <button 
                        onClick={() => { setSelectedUserForGift(user); setGiftModalOpen(true); }}
                        className={`${uiStyles.btn} ${styles.actionBtn} ${styles.btnSuccess}`}
                        title="Gift Premium"
                    >
                        <FaGift />
                    </button>
                    <button 
                        onClick={() => handleToggleRole(user.id, user.role)}
                        className={`${uiStyles.btn} ${styles.actionBtn} ${user.role === 'admin' || user.role === 'super_admin' ? uiStyles.btnDanger : uiStyles.btnPrimary}`}
                        disabled={processingId === user.id}
                        title={(user.role === 'admin' || user.role === 'super_admin') ? t('usersTab.revokeAdmin', {defaultValue: 'Revoke Admin'}) : t('usersTab.makeAdmin', {defaultValue: 'Make Admin'})}
                    >
                        {(user.role === 'admin' || user.role === 'super_admin') ? <FaUserAltSlash /> : <FaUserCheck />}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{t('usersTab.title', {defaultValue: 'Users'})} ({processedUsers.length})</h2>
                <div className={styles.headerControls}>
                    <div className={styles.searchWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={t('usersTab.searchPlaceholder', {defaultValue: 'Search email...'})}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button 
                        onClick={() => setPromoModalOpen(true)} 
                        className={`${uiStyles.btn} ${uiStyles.btnPurple}`}
                    >
                        <FaTag /> Promo Codes
                    </button>
                    <button onClick={fetchUsers} className={styles.refreshBtn}>
                        {t('usersTab.refresh', {defaultValue: 'Refresh'})}
                    </button>
                </div>
            </div>
            
            {loading ? (
                <div className={styles.loader}>{t('usersTab.loading', {defaultValue: 'Loading...'})}</div>
            ) : error ? (
                <div className={styles.error}>{t('usersTab.error', {defaultValue: 'Error:'})} {error}</div>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={processedUsers} 
                    emptyMessage={t('usersTab.empty', {defaultValue: 'No users found'})}
                    rowClassName={(row) => processingId === row.id ? styles.processingRow : ''}
                />
            )}

            <CityAssignmentModal 
                isOpen={cityModalOpen} onClose={() => setCityModalOpen(false)}
                selectedAdmin={selectedAdmin} availableCities={availableCities}
                adminCities={adminCities} toggleCitySelection={toggleCitySelection}
                saveCityAssignments={saveCityAssignments} processingId={processingId}
            />

            <GiftSubscriptionModal 
                isOpen={giftModalOpen} onClose={() => setGiftModalOpen(false)}
                selectedUser={selectedUserForGift} onGrant={handleGrantSubscription}
            />

            <PromoCodesModal 
                isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)}
                adminUsersAPI={adminUsersAPI}
            />
        </div>
    );
}