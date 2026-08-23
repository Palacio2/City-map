import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUserShield, FaCrown, FaUserPlus, FaMapMarkerAlt, FaGift, FaTag, FaSyncAlt, FaPowerOff, FaTrash, FaCopy, FaCheck, FaSlidersH, FaUserMinus, FaGem, FaBuilding, FaUser } from 'react-icons/fa';
import { AdminUser } from '@admin/core/types/admin.types';
import { UserRow } from './types';

const BADGE_BASE = "inline-flex items-center justify-center gap-1.5 h-7.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border shadow-2xs select-none transition-all";

export function useUsersColumns({ logic, currentAdmin, canDo, copiedId, handleCopyId }: any) {
    const { t } = useTranslation('db');

    const columns = useMemo(() => {
        return [
            // 1. КОРИСТУВАЧ
            { 
                header: t('admin_users.tab.col_user'), 
                accessor: 'email', 
                render: (row: UserRow) => {
                    const initials = (row.email || 'U').substring(0, 2).toUpperCase();
                    return (
                        <div className="flex items-center gap-3 min-w-[210px]">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-2xs">
                                {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-textMain text-xs sm:text-sm truncate" title={row.email}>
                                    {row.email}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => handleCopyId(row.id, e)}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-textMuted hover:text-primary transition-colors text-left group/id mt-0.5 cursor-pointer"
                                    title={t('admin_users.table.copy_id')}
                                >
                                    <span>{row.id.substring(0, 8)}...</span>
                                    {copiedId === row.id ? (
                                        <FaCheck className="text-emerald-500 text-[9px]" />
                                    ) : (
                                        <FaCopy className="text-[9px] opacity-0 group-hover/id:opacity-100 transition-opacity" />
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                } 
            },

            // 2. ТАРИФ ПІДПИСКИ
            { 
                header: t('admin_users.tab.col_plan'), 
                accessor: 'plan', 
                render: (row: UserRow) => {
                    switch (row.plan?.toLowerCase()) {
                        case 'realtor':
                        case 'ріелтор':
                            return (
                                <span className={`${BADGE_BASE} bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/50`}>
                                    <FaBuilding className="text-[10px] text-cyan-600 dark:text-cyan-400" />
                                    <span>{t('admin_users.roles.realtor')}</span>
                                </span>
                            );
                        case 'premium':
                        case 'преміум':
                            return (
                                <span className={`${BADGE_BASE} bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/50`}>
                                    <FaGem className="text-[10px] text-purple-600 dark:text-purple-400" />
                                    <span>Premium</span>
                                </span>
                            );
                        default:
                            return (
                                <span className={`${BADGE_BASE} bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/50 dark:border-slate-600/50`}>
                                    <FaUser className="text-[9px] opacity-50" />
                                    <span>{t('admin_users.roles.basic')}</span>
                                </span>
                            );
                    }
                }
            },

            // 3. АДМІН-ДОСТУП ТА КЕРУВАННЯ РОЛЯМИ
            { 
                header: t('admin_users.tab.col_role'), 
                accessor: 'role', 
                render: (row: UserRow) => {
                    const isSuper = row.role === 'super_admin';
                    const isSelf = currentAdmin?.id === row.id;

                    if (isSuper) {
                        return (
                            <span className={`${BADGE_BASE} bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/60`}>
                                <FaCrown className="text-[11px] text-amber-500 shrink-0" />
                                <span>Super Admin</span>
                            </span>
                        );
                    }

                    if (row.role === 'admin') {
                        return (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`${BADGE_BASE} bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/60`}>
                                    <FaUserShield className="text-[11px] text-sky-500 shrink-0" />
                                    <span>Admin</span>
                                </span>
                                {!isSelf && currentAdmin?.role === 'super_admin' && (
                                    <button
                                        type="button"
                                        onClick={() => logic.handleRoleChange(row.id, 'user')}
                                        className={`${BADGE_BASE} bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/60 hover:border-rose-500 cursor-pointer active:scale-95`}
                                        title={t('admin_users.tab.revoke_admin')}
                                    >
                                        <FaUserMinus className="text-[10px] text-rose-600 dark:text-rose-400 shrink-0" />
                                        <span>{t('admin_users.table.revoke')}</span>
                                    </button>
                                )}
                            </div>
                        );
                    }

                    // Зелена акцентна кнопка призначення ролі
                    return currentAdmin?.role === 'super_admin' ? (
                        <button
                            type="button"
                            onClick={() => logic.handleRoleChange(row.id, 'admin')}
                            className={`${BADGE_BASE} bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/60 hover:border-emerald-500 cursor-pointer active:scale-95`}
                            title={t('admin_users.tab.make_admin')}
                        >
                            <FaUserPlus className="text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{t('admin_users.table.make_admin')}</span>
                        </button>
                    ) : (
                        <span className="text-textMuted/40 font-mono text-xs">-</span>
                    );
                }
            },

            // 4. ЗОНА ДОСТУПУ (МІСТА / ВКЛАДКИ)
            { 
                header: t('admin_users.tab.col_cities'), 
                accessor: 'cities', 
                render: (row: UserRow) => {
                    if (row.role === 'super_admin') {
                        return (
                            <span className={`${BADGE_BASE} bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/50`}>
                                Всі міста та модулі
                            </span>
                        );
                    }

                    if (row.role === 'admin') {
                        return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {canDo('users.assign_cities') && (
                                    <button 
                                        type="button"
                                        onClick={() => logic.openCityModal(row as unknown as AdminUser)} 
                                        className={`${BADGE_BASE} bg-main hover:bg-hover text-textMain border-border hover:border-primary/40 cursor-pointer active:scale-95`}
                                    >
                                        <FaMapMarkerAlt className="text-[10px] text-primary shrink-0" /> 
                                        <span>
                                            {row.cities && row.cities.length > 0 
                                                ? t('admin_users.tab.cities_count', { count: row.cities.length }) 
                                                : t('admin_users.tab.assign_cities_btn')}
                                        </span>
                                    </button>
                                )}
                                {currentAdmin?.role === 'super_admin' && (
                                    <button 
                                        type="button"
                                        onClick={() => logic.openTabsModal(row as unknown as AdminUser)} 
                                        className={`${BADGE_BASE} bg-main hover:bg-hover text-textMain border-border hover:border-purple-500/40 cursor-pointer active:scale-95`}
                                    >
                                        <FaSlidersH className="text-[10px] text-purple-500 shrink-0" />
                                        <span>{t('admin_users.tab.tabs_btn')}</span>
                                    </button>
                                )}
                            </div>
                        );
                    }

                    return <span className="text-textMuted/40 font-mono text-xs">—</span>;
                }
            },

            // 5. ДАТА РЕЄСТРАЦІЇ
            { 
                header: t('admin_users.tab.col_reg'), 
                accessor: 'created_at', 
                render: (row: UserRow) => (
                    <span className="text-textMuted font-mono font-semibold text-xs whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('uk-UA')}
                    </span>
                ) 
            },

            // 6. ДІЇ
            { 
                header: '', 
                accessor: 'actions', 
                render: (row: UserRow) => {
                    const isSuper = row.role === 'super_admin';
                    const isSelf = currentAdmin?.id === row.id;
                    const canManageUser = row.role === 'user' || currentAdmin?.role === 'super_admin';

                    return (
                        <div className="flex items-center gap-1 justify-end">
                            {canDo('users.gift_sub') && canManageUser && (
                                <button 
                                    type="button"
                                    onClick={() => logic.openGiftModal({ id: row.id, email: row.email })} 
                                    className="p-2 text-textMuted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                                    title={t('admin_users.tab.gift_title')}
                                >
                                    <FaGift className="text-sm" />
                                </button>
                            )}

                            {canDo('users.terminate') && canManageUser && (
                                <button
                                    type="button"
                                    onClick={() => logic.handleTerminateSessions(row.id)}
                                    className="p-2 text-textMuted hover:text-amber-600 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                                    title={t('admin_users.tab.terminate_sessions')}
                                >
                                    <FaPowerOff className="text-sm" />
                                </button>
                            )}

                            {canDo('users.delete') && canManageUser && (
                                <button
                                    type="button"
                                    onClick={() => logic.handleDeleteUser(row.id, row.email)}
                                    disabled={isSelf || isSuper}
                                    className="p-2 text-textMuted hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-20 cursor-pointer"
                                    title={t('admin_users.tab.delete_user')}
                                >
                                    <FaTrash className="text-sm" />
                                </button>
                            )}
                        </div>
                    );
                }
            }
        ];
    }, [t, logic, canDo, currentAdmin, copiedId, handleCopyId]);

    return columns;
}
