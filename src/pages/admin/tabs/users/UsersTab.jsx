import React, { useMemo } from 'react';
import { adminUsersAPI } from '@api/adminUsersAPI';
import { FaUserShield, FaCrown, FaUserAltSlash, FaUserCheck, FaMapMarkerAlt, FaGift, FaTag, FaTrash } from 'react-icons/fa';
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

export default function UsersTab() {
    const { t } = useTranslation('db');    
    const { currentAdmin } = useAdmin();
    const logic = useUsersManager(currentAdmin, t);

    const getRoleBadge = (role) => {
        if (role === 'super_admin') return <Badge variant="purple" icon={FaCrown}>{t('admin_users.roles.super_admin')}</Badge>;
        if (role === 'admin') return <Badge variant="primary" icon={FaUserShield}>{t('admin_users.roles.admin')}</Badge>;
        return <Badge variant="default">{t('admin_users.roles.user')}</Badge>;
    };

    const getPlanBadge = (plan) => {
        if (plan === 'realtor') return <Badge variant="success">{t('admin_users.plans.realtor')}</Badge>;
        if (plan === 'premium') return <Badge variant="primary">{t('admin_users.plans.premium')}</Badge>;
        return <Badge variant="default" className="opacity-70">{t('admin_users.plans.basic')}</Badge>;
    };

    const columns = useMemo(() => [
        { header: t('admin_users.tab.col_id'), accessor: 'id', render: (row) => <span className="font-mono text-[0.85rem] text-textMuted bg-surface px-2 py-1 rounded-md border border-border">{row.id.substring(0, 8)}...</span> },
        { header: t('admin_users.tab.col_email'), accessor: 'email', render: (row) => <span className="font-bold text-textMain">{row.email}</span> },
        { header: t('admin_users.tab.col_plan'), accessor: 'plan', render: (row) => (
            <div className="flex flex-col gap-1.5 items-start">
                {getPlanBadge(row.plan)}
                {getRoleBadge(row.role)}
            </div>
        )},
        { header: t('admin_users.tab.col_cities'), accessor: 'cities', render: (row) => (
            <div className="flex flex-col gap-1.5 items-start">
                {row.role !== 'user' ? (
                    row.role === 'super_admin' ? (
                        <span className="text-[0.8rem] font-bold text-primary bg-blue-500/10 px-2 py-1 rounded-md">{t('admin_users.tab.all_cities')}</span>
                    ) : (
                        <button onClick={() => logic.openCityModal(row)} className="text-[0.8rem] font-bold text-primary bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md cursor-pointer hover:bg-blue-500/20 transition-all flex items-center gap-1.5">
                            <FaMapMarkerAlt /> {row.cities?.length > 0 ? row.cities.length : t('admin_users.tab.assign_cities_btn')}
                        </button>
                    )
                ) : <span className="text-textMuted text-[0.85rem]">-</span>}
            </div>
        )},
        { header: t('admin_users.tab.col_rodo'), accessor: 'rodo_accepted', render: (row) => row.rodo_accepted ? t('common.status.yes') : t('common.status.no') },
        { header: t('admin_users.tab.col_searches'), accessor: 'searches_count', render: (row) => <span className="font-bold text-textMain">{row.searches_count}</span> },
        { header: t('admin_users.tab.col_reg'), accessor: 'created_at', render: (row) => <span className="text-textMuted text-[0.9rem] font-medium">{new Date(row.created_at).toLocaleDateString()}</span> },
        { header: t('admin_users.tab.col_actions'), accessor: 'actions', render: (row) => {
            const isSuper = row.role === 'super_admin';
            const isSelf = currentAdmin?.id === row.id;

            return (
                <div className="flex gap-2 justify-end">
                    <button onClick={() => logic.openGiftModal(row)} className="bg-orange-500/10 text-orange-600 border border-orange-500/20 w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all hover:bg-orange-500/20 shadow-sm" title={t('admin_users.tab.gift_title')}>
                        <FaGift size={14} />
                    </button>

                    {row.role === 'admin' ? (
                        <button 
                            onClick={() => logic.handleRoleChange(row.id, 'user')} 
                            disabled={isSelf || isSuper}
                            className={`w-8 h-8 flex items-center justify-center rounded-md border shadow-sm transition-all ${isSelf || isSuper ? 'bg-surface text-textMuted border-border cursor-not-allowed opacity-50' : 'bg-red-500/10 text-danger border-red-500/20 cursor-pointer hover:bg-danger hover:text-white'}`}
                            title={isSuper ? t('admin_users.tab.cannot_edit_super') : isSelf ? t('admin_users.tab.cannot_edit_self') : t('admin_users.tab.revoke_admin')}
                        >
                            <FaUserAltSlash size={14} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => logic.handleRoleChange(row.id, 'admin')} 
                            disabled={isSuper}
                            className={`w-8 h-8 flex items-center justify-center rounded-md border shadow-sm transition-all ${isSuper ? 'bg-surface text-textMuted border-border cursor-not-allowed opacity-50' : 'bg-emerald-500/10 text-success border-emerald-500/20 cursor-pointer hover:bg-success hover:text-white'}`}
                            title={isSuper ? t('admin_users.tab.cannot_edit_super') : t('admin_users.tab.make_admin')}
                        >
                            <FaUserCheck size={14} />
                        </button>
                    )}
                    
                    <button 
                        onClick={() => logic.handleTerminateSessions(row.id)} 
                        className="bg-surface border border-border text-textMuted w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-all hover:bg-main hover:text-textMain shadow-sm"
                        title={t('admin_users.tab.terminate_sessions')}
                    >
                        🔌
                    </button>
                    <button 
                        onClick={() => logic.handleDeleteUser(row.id, row.email)} 
                        disabled={isSelf || isSuper}
                        className={`w-8 h-8 flex items-center justify-center rounded-md border shadow-sm transition-all ${isSelf || isSuper ? 'bg-surface text-textMuted border-border cursor-not-allowed opacity-50' : 'bg-surface border-border text-textMuted cursor-pointer hover:bg-red-500/10 hover:text-danger hover:border-red-500/20'}`}
                        title={t('admin_users.tab.delete_user')}
                    >
                        🗑️
                    </button>
                </div>
            );
        }}
    ], [t, currentAdmin?.id, logic.processingId]);

    return (
        <div className="flex flex-col gap-6 pb-8 animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="m-0 text-[1.4rem] text-textMain font-extrabold tracking-tight mb-1">{t('admin_users.tab.title')}</h2>
                    <span className="text-[0.95rem] text-textMuted font-medium">{t('admin_users.tab.subtitle')}</span>
                </div>
                <div className="flex gap-3">
                    <Button variant="primary" onClick={() => logic.setPromoModalOpen(true)} className="!shadow-sm">
                        <FaTag className="mr-2" /> {t('admin_users.tab.btn_promo_codes')}
                    </Button>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border bg-main/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border w-full md:w-auto">
                        {['all', 'super_admin', 'admin', 'user', 'premium'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => logic.setFilterTab(tab)}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-[0.85rem] font-bold transition-all ${logic.filterTab === tab ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-textMain hover:bg-main'}`}
                            >
                                {tab === 'all' && t('admin_users.tab.filter_all')}
                                {tab === 'super_admin' && t('admin_users.tab.filter_super')}
                                {tab === 'admin' && t('admin_users.tab.filter_admins')}
                                {tab === 'user' && t('admin_users.tab.filter_users')}
                                {tab === 'premium' && t('admin_users.tab.filter_premium')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <SearchInput 
                            value={logic.searchTerm} 
                            onChange={(e) => logic.setSearchTerm(e.target.value)} 
                            placeholder={t('admin_users.tab.search_placeholder')} 
                            className="w-full md:w-[250px]"
                        />
                        <Button variant="cancel" onClick={logic.fetchUsers} disabled={logic.loading} className="!px-3 !shadow-none" title={t('admin_users.tab.refresh')}>
                            🔄
                        </Button>
                    </div>
                </div>

                {logic.loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-primary bg-surface">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                        <span className="font-bold text-[1.1rem]">{t('common.loading')}</span>
                    </div>
                ) : logic.error ? (
                    <div className="py-16 px-6 text-center bg-surface">
                        <div className="inline-flex flex-col items-center gap-3 p-6 bg-red-500/5 rounded-xl border border-red-500/20">
                            <span className="text-[2rem]">❌</span>
                            <h3 className="text-danger m-0 text-[1.1rem] font-bold">{t('common.error')}</h3>
                            <p className="text-textMain m-0 font-medium">{logic.error}</p>
                        </div>
                    </div>
                ) : (
                    <DataTable 
                        columns={columns} 
                        data={logic.processedUsers} 
                        emptyMessage={t('admin_users.tab.empty')}
                        rowClassName={(row) => logic.processingId === row.id ? 'opacity-50 pointer-events-none bg-main transition-all' : 'transition-colors'}
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