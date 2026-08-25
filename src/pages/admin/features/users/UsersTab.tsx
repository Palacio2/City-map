import { useMemo, useState } from 'react';
import { adminUsersAPI } from '@admin/features/users/adminUsersAPI';
import { 
    FaUsers, FaSyncAlt, FaTag
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import React from 'react';
import DataTable from '@admin/core/ui/DataTable';
import { Pagination } from '@admin/core/ui/Pagination';
import { Button } from '@admin/core/ui/Button';
import { SearchInput } from '@admin/core/ui/SearchInput';
import { useAdmin } from '@admin/core/context/AdminContext';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useUsersManager } from '@admin/features/users/useUsersManager';
import CityAssignmentModal from '@admin/features/users/CityAssignmentModal';
import GiftSubscriptionModal from '@admin/features/users/GiftSubscriptionModal';
import PromoCodesModal from '@admin/features/users/PromoCodesModal';
import AdminTabsModal from '@admin/features/users/AdminTabsModal';
import { AdminUser } from '@admin/core/types/admin.types';
import { UserRow } from './types';
import { useUsersColumns } from './useUsersColumns';

const BADGE_BASE = "inline-flex items-center justify-center gap-1.5 h-7.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border shadow-2xs select-none transition-all";

export default function UsersTab() {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const { canDo } = useActionGuard();
    const logic = useUsersManager(currentAdmin, t);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyId = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1800);
    };

    // Розділені вкладки фільтрації з лічильниками
    const filterTabs = [
        { id: 'all', label: t('admin_users.tab.filter_all'), count: logic.userCounts.all },
        { id: 'super_admin', label: t('admin_users.tab.filter_super'), count: logic.userCounts.super_admin },
        { id: 'admin', label: t('admin_users.tab.filter_admins'), count: logic.userCounts.admin },
        { id: 'user', label: t('admin_users.tab.filter_users'), count: logic.userCounts.user },
        { id: 'realtor', label: t('admin_users.tab.filter_realtor'), count: logic.userCounts.realtor },
        { id: 'premium', label: t('admin_users.tab.filter_premium'), count: logic.userCounts.premium }
    ];

    const columns = useUsersColumns({ logic, currentAdmin, canDo, copiedId, handleCopyId });

    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = React.useState(1);

    const safeUsers = logic.filteredUsers || [];
    const paginatedUsers = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return safeUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [safeUsers, currentPage]);

    const totalPages = Math.ceil(safeUsers.length / ITEMS_PER_PAGE);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [logic.searchQuery, logic.filterTab]);

    return (
        <div className="flex flex-col gap-4 sm:gap-6 w-full pb-8 flex-1 h-full animate-fadeIn">
            {/* Хедер сторінки */}
            <div className="bg-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary/10 text-primary rounded-2xl border border-primary/30 flex items-center justify-center text-lg sm:text-xl shadow-2xs shrink-0">
                        <FaUsers />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="m-0 text-base sm:text-xl font-bold text-textMain tracking-tight">
                                {t('admin_users.tab.title')}
                            </h2>
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md">
                                {logic.processedUsers.length}
                            </span>
                        </div>
                        <p className="m-0 text-textMuted text-xs sm:text-sm mt-0.5 font-medium">
                            {t('admin_users.tab.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {canDo('users.promo_codes') && (
                        <Button 
                            variant="primary" 
                            size="md" 
                            onClick={() => logic.setPromoModalOpen(true)}
                            className="shadow-xs text-xs font-bold"
                        >
                            <FaTag className="text-xs" /> 
                            <span>{t('admin_users.tab.btn_promo_codes')}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Панель фільтрації та пошуку */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-surface p-2.5 sm:p-3 rounded-2xl border border-border shadow-2xs">
                {/* Окремі сегментовані фільтри */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 touch-pan-x">
                    {filterTabs.map(tab => {
                        const isActive = logic.filterTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => logic.setFilterTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
                                    isActive
                                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                        : 'bg-transparent border-transparent text-textMuted hover:text-textMain hover:bg-surface hover:border-border'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className={`font-mono text-[11px] px-1.5 rounded-full ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-textMuted'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Пошук та кнопка оновлення */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <SearchInput
                        value={logic.searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => logic.setSearchTerm(e.target.value)}
                        placeholder={t('admin_users.tab.search_placeholder')}
                        className="w-full sm:w-72"
                    />
                    <button 
                        type="button"
                        onClick={() => logic.fetchUsers()} 
                        disabled={logic.loading}
                        className="p-2.5 text-textMuted hover:text-textMain bg-main/50 hover:bg-hover border border-border rounded-xl transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-40"
                        title={t('common.refresh')}
                    >
                        <FaSyncAlt className={`text-xs ${logic.loading ? 'animate-spin text-primary' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Таблиця користувачів */}
            <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border shadow-2xs overflow-hidden overflow-x-auto">
                {logic.loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-textMuted text-xs font-semibold">
                        <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
                        <span>{t('common.loading')}</span>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={logic.processedUsers as unknown as UserRow[]}
                        emptyMessage={t('admin_users.tab.empty')}
                    />
                )}
            </div>

            {/* Модальні вікна */}
            <CityAssignmentModal
                isOpen={logic.cityModalOpen}
                onClose={() => logic.setCityModalOpen(false)}
                selectedAdmin={logic.selectedAdmin}
                availableCities={logic.availableCities}
                adminCities={logic.adminCities}
                toggleCitySelection={logic.toggleCitySelection}
                setAdminCities={logic.setAdminCities}
                saveCityAssignments={logic.saveCityAssignments}
                processingId={logic.processingId}
                t={t}
            />

            <AdminTabsModal
                isOpen={logic.tabsModalOpen}
                onClose={() => logic.setTabsModalOpen(false)}
                selectedAdmin={logic.selectedAdmin}
                adminTabs={logic.adminTabs}
                toggleTabSelection={logic.toggleTabSelection}
                saveTabAssignments={logic.saveTabAssignments}
                processingId={logic.processingId}
                t={t}
            />

            <GiftSubscriptionModal
                isOpen={logic.giftModalOpen}
                onClose={() => logic.setGiftModalOpen(false)}
                selectedUser={logic.selectedUserForGift}
                onGrant={logic.handleGrantSubscription}
                onRevoke={logic.handleRevokeSubscription}
                t={t}
            />

            <PromoCodesModal
                isOpen={logic.promoModalOpen}
                onClose={() => logic.setPromoModalOpen(false)}
                adminUsersAPI={adminUsersAPI}
                t={t}
            />
        </div>
    );
}

