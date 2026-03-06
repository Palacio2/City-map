import React, { useState, useEffect, useMemo } from 'react';
import { adminUsersAPI } from '@api/adminUsersAPI';
import styles from './UsersTab.module.css';
import { FaUserShield, FaCrown, FaHome, FaSearch, FaUserAltSlash, FaUserCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function UsersTab() {
    const { t } = useTranslation('admin');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

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
        if (!window.confirm(t('usersTab.confirmRole'))) return;
        
        try {
            setProcessingId(userId);
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            await adminUsersAPI.updateUser(userId, 'update_role', newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
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
            setUsers(users.map(u => u.id === userId ? { ...u, rodo_accepted: newRodo } : u));
        } catch (err) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const getRoleBadge = (plan, role) => {
        if (role === 'admin') return <span className={styles.badgeAdmin}><FaUserShield /> Admin</span>;
        if (plan === 'realtor') return <span className={styles.badgeRealtor}><FaHome /> Realtor</span>;
        if (plan === 'premium') return <span className={styles.badgePremium}><FaCrown /> Premium</span>;
        return <span className={styles.badgeBasic}>Basic</span>;
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const term = searchTerm.toLowerCase();
            return (
                user.email?.toLowerCase().includes(term) ||
                user.id.toLowerCase().includes(term)
            );
        });
    }, [users, searchTerm]);

    if (loading) return <div className={styles.loader}>{t('usersTab.loading')}</div>;
    if (error) return <div className={styles.error}>{t('usersTab.error')} {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{t('usersTab.title')} ({filteredUsers.length})</h2>
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
                    <button onClick={fetchUsers} className={styles.refreshBtn}>{t('usersTab.refresh')}</button>
                </div>
            </div>
            
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t('usersTab.colId')}</th>
                            <th>{t('usersTab.colEmail')}</th>
                            <th>{t('usersTab.colPlan')}</th>
                            <th>{t('usersTab.colRodo')}</th>
                            <th>{t('usersTab.colSearches')}</th>
                            <th>{t('usersTab.colReg')}</th>
                            <th>{t('usersTab.colActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={{ opacity: processingId === user.id ? 0.5 : 1 }}>
                                <td className={styles.idCell} title={user.id}>{user.id.substring(0, 8)}...</td>
                                <td>{user.email}</td>
                                <td>{getRoleBadge(user.plan, user.role)}</td>
                                <td>
                                    <button 
                                        onClick={() => handleToggleRodo(user.id, user.rodo_accepted)}
                                        className={styles.rodoBtn}
                                        disabled={processingId === user.id}
                                    >
                                        {user.rodo_accepted 
                                            ? <span className={styles.statusYes}>{t('usersTab.yes')}</span> 
                                            : <span className={styles.statusNo}>{t('usersTab.no')}</span>}
                                    </button>
                                </td>
                                <td>
                                    <span className={styles.searchCount}>
                                        <FaSearch /> {user.search_count}
                                    </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString('uk-UA')}</td>
                                <td className={styles.actionsCell}>
                                    <button 
                                        onClick={() => handleToggleRole(user.id, user.role)}
                                        className={`${styles.actionBtn} ${user.role === 'admin' ? styles.btnDanger : styles.btnSuccess}`}
                                        disabled={processingId === user.id}
                                        title={user.role === 'admin' ? t('usersTab.revokeAdmin') : t('usersTab.makeAdmin')}
                                    >
                                        {user.role === 'admin' ? <FaUserAltSlash /> : <FaUserCheck />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan="7" className={styles.empty}>{t('usersTab.empty')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}