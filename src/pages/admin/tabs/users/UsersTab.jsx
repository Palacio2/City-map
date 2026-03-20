import React, { useState, useEffect, useMemo } from 'react';
import { adminUsersAPI } from '@api/adminUsersAPI';
import { supabase } from '@supabaseClient';
import styles from './UsersTab.module.css';
import { FaUserShield, FaCrown, FaHome, FaSearch, FaUserAltSlash, FaUserCheck, FaMapMarkerAlt, FaGift, FaTag } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import uiStyles from '../../ui/AdminUI.module.css';
import { useAdmin } from '../../hooks/AdminContext';

import CityAssignmentModal from './CityAssignmentModal';
import GiftSubscriptionModal from './GiftSubscriptionModal';
import PromoCodesModal from './PromoCodesModal';

export default function UsersTab() {
    const { t } = useTranslation('admin');
    const { currentAdmin } = useAdmin();

    const [users, setUsers] = useState([]);
    const [availableCities, setAvailableCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    
    // Стан для пошуку та фільтрації (вкладок)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all'); // 'all', 'admins', 'premium'
    
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
        if (currentRole === 'super_admin') {
            alert(t('usersTab.cannotDemoteSuper'));
            return;
        }
        if (userId === currentAdmin?.id) {
            alert(t('usersTab.cannotDemoteSelf'));
            return;
        }

        if (!window.confirm(t('usersTab.confirmRole'))) return;
        try {
            setProcessingId(userId);
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
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
            setGiftModalOpen(false);
            fetchUsers(); 
        } catch (err) {
            alert('Failed to grant: ' + err.message);
        }
    };

    const getRoleBadge = (plan, role) => {
        if (role === 'super_admin') return <span className={styles.badgeSuperAdmin}><FaCrown /> Super Admin</span>;
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
        <div onClick={() => handleSort(key)} className={styles.sortableHeader}>
            {label}
            <span className={`${styles.sortIcon} ${sortConfig.key === key ? styles.sortIconActive : styles.sortIconInactive}`}>
                {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
            </span>
        </div>
    );

    const processedUsers = useMemo(() => {
        let result = users.filter(user => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = user.email?.toLowerCase().includes(term) || user.id.toLowerCase().includes(term);
            
            if (!matchesSearch) return false;
            
            // Застосовуємо фільтри вкладок
            if (filterTab === 'admins') return user.role === 'admin' || user.role === 'super_admin';
            if (filterTab === 'premium') return user.plan === 'premium' || user.plan === 'realtor';
            return true;
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
    }, [users, searchTerm, sortConfig, filterTab]);

    const columns = [
        { header: t('usersTab.colId'), render: (user) => <span title={user.id} className={styles.idCell}>{user.id.substring(0, 8)}...</span> },
        { header: renderSortableHeader(t('usersTab.colEmail'), 'email'), accessor: 'email' },
        { header: renderSortableHeader(t('usersTab.colPlan'), 'role'), render: (user) => getRoleBadge(user.plan, user.role) },
        { 
            header: t('usersTab.colCities'),
            render: (user) => {
                if (user.role !== 'admin' && user.role !== 'super_admin') return <span className={styles.placeholder}>-</span>;
                const count = user.assigned_cities?.length || 0;
                return (
                    <button onClick={() => openCityModal(user)} className={styles.cityManageBtn} disabled={processingId === user.id}>
                        <FaMapMarkerAlt /> {count > 0 ? t('usersTab.citiesCount', { count }) : t('usersTab.assignCitiesBtn')}
                    </button>
                );
            }
        },
        { 
            header: t('usersTab.colRodo'), 
            render: (user) => (
                <button onClick={() => handleToggleRodo(user.id, user.rodo_accepted)} className={styles.rodoBtn} disabled={processingId === user.id}>
                    {user.rodo_accepted ? <span className={styles.statusYes}>{t('usersTab.yes')}</span> : <span className={styles.statusNo}>{t('usersTab.no')}</span>}
                </button>
            ) 
        },
        { 
            header: renderSortableHeader(t('usersTab.colSearches'), 'search_count'), 
            render: (user) => <span className={styles.searchCount}><FaSearch style={{fontSize: '0.8rem', opacity: 0.7}}/> {user.search_count}</span> 
        },
        { 
            header: renderSortableHeader(t('usersTab.colReg'), 'created_at'), 
            render: (user) => <span className={styles.dateCell}>{new Date(user.created_at).toLocaleDateString('uk-UA')}</span> 
        },
        {
            header: t('usersTab.colActions'),
            render: (user) => {
                const isSelf = currentAdmin?.id === user.id;
                const isTargetSuperAdmin = user.role === 'super_admin';
                const canToggleRole = !isSelf && !isTargetSuperAdmin;

                let roleTooltip = t('usersTab.makeAdmin');
                if (isSelf) roleTooltip = t('usersTab.cannotEditSelf');
                else if (isTargetSuperAdmin) roleTooltip = t('usersTab.cannotEditSuper');
                else if (user.role === 'admin') roleTooltip = t('usersTab.revokeAdmin');

                return (
                    <div className={styles.actionButtons}>
                        <button 
                            onClick={() => { setSelectedUserForGift(user); setGiftModalOpen(true); }}
                            className={`${uiStyles.btn} ${styles.actionBtn} ${styles.btnGift}`}
                        >
                            <FaGift />
                        </button>
                        <button 
                            onClick={() => handleToggleRole(user.id, user.role)}
                            className={`${uiStyles.btn} ${styles.actionBtn} ${(user.role === 'admin' || user.role === 'super_admin') ? styles.btnRevoke : styles.btnGrant}`}
                            disabled={processingId === user.id || !canToggleRole}
                            title={roleTooltip}
                        >
                            {(user.role === 'admin' || user.role === 'super_admin') ? <FaUserAltSlash /> : <FaUserCheck />}
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitleGroup}>
                    <h2 className={styles.title}>{t('usersTab.title')} <span className={styles.badge}>{processedUsers.length}</span></h2>
                    
                    {/* ТАБИ ФІЛЬТРАЦІЇ */}
                    <div className={styles.tabsWrapper}>
                        <button className={`${styles.filterTab} ${filterTab === 'all' ? styles.activeTab : ''}`} onClick={() => setFilterTab('all')}>
                            {t('usersTab.filterAll')}
                        </button>
                        <button className={`${styles.filterTab} ${filterTab === 'admins' ? styles.activeTab : ''}`} onClick={() => setFilterTab('admins')}>
                            {t('usersTab.filterAdmins')}
                        </button>
                        <button className={`${styles.filterTab} ${filterTab === 'premium' ? styles.activeTab : ''}`} onClick={() => setFilterTab('premium')}>
                            {t('usersTab.filterPremium')}
                        </button>
                    </div>
                </div>

                <div className={styles.headerControls}>
                    <div className={styles.searchWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={t('usersTab.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <button onClick={() => setPromoModalOpen(true)} className={`${uiStyles.btn} ${uiStyles.btnPurple}`}>
                        <FaTag /> <span className={styles.hideOnMobile}>{t('usersTab.btnPromoCodes')}</span>
                    </button>
                </div>
            </div>
            
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loaderWrapper}>
                        <div className={styles.spinner}></div>
                        <span>{t('usersTab.loading')}</span>
                    </div>
                ) : error ? (
                    <div className={styles.errorWrapper}>
                        <span className={styles.errorIcon}>⚠️</span>
                        <div>
                            <strong>{t('usersTab.error')}</strong>
                            <p>{error}</p>
                        </div>
                    </div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={processedUsers} 
                        emptyMessage={t('usersTab.empty')}
                        rowClassName={(row) => processingId === row.id ? styles.processingRow : ''}
                    />
                )}
            </div>

            <CityAssignmentModal 
                isOpen={cityModalOpen} onClose={() => setCityModalOpen(false)}
                selectedAdmin={selectedAdmin} availableCities={availableCities}
                adminCities={adminCities} toggleCitySelection={toggleCitySelection}
                saveCityAssignments={saveCityAssignments} processingId={processingId} t={t}
            />

            <GiftSubscriptionModal 
                isOpen={giftModalOpen} onClose={() => setGiftModalOpen(false)}
                selectedUser={selectedUserForGift} onGrant={handleGrantSubscription} t={t}
            />

            <PromoCodesModal 
                isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)}
                adminUsersAPI={adminUsersAPI} t={t}
            />
        </div>
    );
}