import { useMemo } from 'react';
import { adminUsersAPI } from '../../api/adminUsersAPI';
import { FaUserShield, FaCrown, FaUserCheck, FaMapMarkerAlt, FaGift, FaTag, FaSyncAlt, FaPowerOff, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DataTable from '../../ui/DataTable';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { SearchInput } from '../../ui/SearchInput';
import { useAdmin } from '../../hooks/AdminContext';
import { useUsersManager } from './useUsersManager';
import CityAssignmentModal from './CityAssignmentModal';
import GiftSubscriptionModal from './GiftSubscriptionModal';
import PromoCodesModal from './PromoCodesModal';
import AdminTabsModal from './AdminTabsModal';

export default function UsersTab() {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const logic = useUsersManager(currentAdmin, t);

    const getPlanBadge = (plan: string) => {
        if (plan === 'realtor') return <Badge variant="success">{t('admin_users.plans.realtor')}</Badge>;
        if (plan === 'premium') return <Badge variant="primary">{t('admin_users.plans.premium')}</Badge>;
        return <Badge variant="default">{t('admin_users.plans.basic')}</Badge>;
    };

    const columns = useMemo(() => [
        { 
            header: t('admin_users.tab.col_id'), 
            accessor: 'id', 
            render: (row: any) => <span className="font-mono text-[11px] text-textMuted">{row.id.substring(0, 8)}...</span> 
        },
        { 
            header: t('admin_users.tab.col_email'), 
            accessor: 'email', 
            render: (row: any) => <span className="font-medium text-textMain">{row.email}</span> 
        },
        { 
            header: t('admin_users.tab.col_plan'), 
            accessor: 'plan', 
            render: (row: any) => {
                const isSuper = row.role === 'super_admin';
                const isSelf = currentAdmin?.id === row.id;

                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        {getPlanBadge(row.plan)}

                        {isSuper ? (
                            <Badge variant="purple" icon={FaCrown}>
                                {t('admin_users.roles.super_admin')}
                            </Badge>
                        ) : row.role === 'admin' ? (
                            <div className="flex items-center gap-1">
                                <Badge variant="primary" icon={FaUserShield}>
                                    {t('admin_users.roles.admin')}
                                </Badge>
                                {!isSelf && (
                                    <button
                                        onClick={() => logic.handleRoleChange(row.id, 'user')}
                                        className="text-[10px] font-medium text-danger hover:underline bg-danger-subtle px-1.5 py-0.5 rounded border border-danger/20 transition-colors"
                                        title={t('admin_users.tab.revoke_admin')}
                                    >
                                        {t('admin_users.tab.revoke')}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => logic.handleRoleChange(row.id, 'admin')}
                                className="text-[10px] font-medium text-textMuted hover:text-primary hover:bg-primary-subtle px-1.5 py-0.5 rounded border border-border hover:border-primary/20 transition-colors flex items-center gap-1"
                                title={t('admin_users.tab.make_admin')}
                            >
                                <FaUserCheck className="text-[9px]" /> {t('admin_users.tab.make_admin_btn')}
                            </button>
                        )}
                    </div>
                );
            }
        },
        { 
            header: t('admin_users.tab.col_cities'), 
            accessor: 'cities', 
            render: (row: any) => (
                <div className="flex items-center gap-1.5">
                    {row.role !== 'user' ? (
                        row.role === 'super_admin' ? (
                            <span className="text-[11px] font-medium text-primary bg-primary-subtle px-2 py-0.5 rounded border border-primary/20">
                                {t('admin_users.tab.all_cities')}
                            </span>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => logic.openCityModal(row)} 
                                    className="text-[11px] font-medium text-primary bg-primary-subtle border border-primary/20 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors flex items-center gap-1"
                                >
                                    <FaMapMarkerAlt className="text-[10px]" /> 
                                    {row.cities?.length > 0 ? `${row.cities.length} міст` : t('admin_users.tab.assign_cities_btn')}
                                </button>
                                <button 
                                    onClick={() => logic.openTabsModal(row)} 
                                    className="text-[11px] font-medium text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded hover:bg-purple-500/20 transition-colors"
                                >
                                    📑 {t('admin_users.tab.tabs_btn')}
                                </button>
                            </div>
                        )
                    ) : <span className="text-textMuted">-</span>}
                </div>
            )
        },
        { 
            header: t('admin_users.tab.col_reg'), 
            accessor: 'created_at', 
            render: (row: any) => <span className="text-textMuted font-mono text-[11px]">{new Date(row.created_at).toLocaleDateString('uk-UA')}</span> 
        },
        { 
            header: '', 
            accessor: 'actions', 
            render: (row: any) => {
                const isSuper = row.role === 'super_admin';
                const isSelf = currentAdmin?.id === row.id;
                return (
                    <div className="flex items-center gap-1 justify-end">
                        <button 
                            onClick={() => logic.openGiftModal(row)} 
                            className="p-1.5 text-textMuted hover:text-warning hover:bg-warning-subtle rounded transition-colors"
                            title={t('admin_users.tab.gift_title')}
                        >
                            <FaGift className="text-xs" />
                        </button>

                        <button
                            onClick={() => logic.handleTerminateSessions(row.id)}
                            className="p-1.5 text-textMuted hover:text-primary hover:bg-primary-subtle rounded transition-colors"
                            title={t('admin_users.tab.terminate_sessions')}
                        >
                            <FaPowerOff className="text-xs" />
                        </button>

                        <button
                            onClick={() => logic.handleDeleteUser(row.id, row.email)}
                            disabled={isSelf || isSuper}
                            className="p-1.5 text-textMuted hover:text-danger hover:bg-danger-subtle rounded transition-colors disabled:opacity-30"
                            title={t('admin_users.tab.delete_user')}
                        >
                            <FaTrash className="text-xs" />
                        </button>
                    </div>
                );
            }
        }
    ], [t, currentAdmin?.id, logic.processingId]);

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                        {t('admin_users.tab.title')}
                    </h2>
                    <p className="m-0 text-textMuted text-xs mt-0.5">
                        {t('admin_users.tab.subtitle')}
                    </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => logic.setPromoModalOpen(true)}>
                    <FaTag className="text-xs" /> {t('admin_users.tab.btn_promo_codes')}
                </Button>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border bg-main/40 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    <div className="flex gap-1 bg-surface p-1 rounded-lg border border-border">
                        {['all', 'super_admin', 'admin', 'user', 'premium'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => logic.setFilterTab(tab)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    logic.filterTab === tab 
                                        ? 'bg-primary text-white shadow-subtle' 
                                        : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                {tab === 'all' && t('admin_users.tab.filter_all')}
                                {tab === 'super_admin' && t('admin_users.tab.filter_super')}
                                {tab === 'admin' && t('admin_users.tab.filter_admins')}
                                {tab === 'user' && t('admin_users.tab.filter_users')}
                                {tab === 'premium' && t('admin_users.tab.filter_premium')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <SearchInput
                            value={logic.searchTerm}
                            onChange={(e: any) => logic.setSearchTerm(e.target.value)}
                            placeholder={t('admin_users.tab.search_placeholder')}
                            className="w-full md:w-64"
                        />
                        <button 
                            onClick={() => logic.fetchUsers()} 
                            disabled={logic.loading}
                            className="p-2 text-textMuted hover:text-textMain bg-surface border border-border rounded-lg transition-colors"
                        >
                            <FaSyncAlt className={`text-xs ${logic.loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {logic.loading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-2 text-textMuted text-xs">
                        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                        <span>{t('common.loading')}</span>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={logic.processedUsers}
                        emptyMessage={t('admin_users.tab.empty')}
                    />
                )}
            </div>

            <CityAssignmentModal
                isOpen={logic.cityModalOpen} onClose={() => logic.setCityModalOpen(false)}
                selectedAdmin={logic.selectedAdmin} availableCities={logic.availableCities}
                adminCities={logic.adminCities} toggleCitySelection={logic.toggleCitySelection}
                setAdminCities={logic.setAdminCities}
                saveCityAssignments={logic.saveCityAssignments} processingId={logic.processingId} t={t}
            />
            <AdminTabsModal
                isOpen={logic.tabsModalOpen} onClose={() => logic.setTabsModalOpen(false)}
                selectedAdmin={logic.selectedAdmin} adminTabs={logic.adminTabs}
                toggleTabSelection={logic.toggleTabSelection} saveTabAssignments={logic.saveTabAssignments}
                processingId={logic.processingId} t={t}
            />
            <GiftSubscriptionModal
                isOpen={logic.giftModalOpen} onClose={() => logic.setGiftModalOpen(false)}
                selectedUser={logic.selectedUserForGift} onGrant={logic.handleGrantSubscription} t={t}
            />
            <PromoCodesModal
                isOpen={logic.promoModalOpen} onClose={() => logic.setPromoModalOpen(false)}
                adminUsersAPI={adminUsersAPI} t={t}
            />
        </div>
    );
}