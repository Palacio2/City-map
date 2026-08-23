import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { useModals } from '@admin/core/context/ModalContext';
import { adminUsersAPI } from '@admin/features/users/adminUsersAPI';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { AdminUser } from '@admin/core/types/admin.types';

export function useUsersManager(_currentAdmin: AdminUser | null | undefined, t: (k: string, options?: Record<string, unknown>) => string) {
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();
    const { withLogging } = useActionLogger();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get('q') || '';
    const filterTab = searchParams.get('tab') || 'all';
    
    const setSearchTerm = (term: string) => {
        setSearchParams(prev => {
            if (term) prev.set('q', term);
            else prev.delete('q');
            return prev;
        }, { replace: true });
    };

    const setFilterTab = (tab: string) => {
        setSearchParams(prev => {
            if (tab && tab !== 'all') prev.set('tab', tab);
            else prev.delete('tab');
            return prev;
        }, { replace: true });
    };

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [cityModalOpen, setCityModalOpen] = useState(false);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [tabsModalOpen, setTabsModalOpen] = useState(false);
    
    // Ensure strict typing using AdminUser
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    // UserRow or at least id & email
    const [selectedUserForGift, setSelectedUserForGift] = useState<{ id: string; email: string } | null>(null);
    
    const [adminCities, setAdminCities] = useState<string[]>([]);
    const [adminTabs, setAdminTabs] = useState<string[]>([]);

    const { data: availableCities = [] } = useQuery({
        queryKey: ['availableCities'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('admin-cities-list', { method: 'POST' });
            if (error) throw error;
            return data.cities || [];
        }
    });

    const { data: users = [], isLoading: loading, error: queryError, refetch: fetchUsers } = useQuery({
        queryKey: ['adminUsersList'],
        queryFn: async () => {
            const data = await adminUsersAPI.getUsers();
            return data.users || data || [];
        }
    });

    const error = queryError?.message || null;

    const handleSort = (key: string) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    const manageUserMutation = useMutation({
        mutationFn: async ({ action, targetUserId, payload }: { action: string; targetUserId: string; payload?: unknown }) => {
            const { data, error } = await withLogging(`users_manage_${action}`, () => supabase.functions.invoke('admin-users-manage', {
                method: 'POST',
                body: { action, targetUserId, payload }
            }), { targetUserId, payload });
            if (error || data?.error) throw new Error(error?.message || data?.error);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsersList'] }),
        onError: (err: unknown) => showAlert(t('common.error'), err instanceof Error ? err.message : 'Error', 'error'),
        onSettled: () => setProcessingId(null)
    });

    const handleRoleChange = (userId: string, newRole: string) => {
        showConfirm(
            t('admin_users.confirm.role_title'),
            t('admin_users.confirm.role_desc'),
            () => {
                setProcessingId(userId);
                manageUserMutation.mutate({ action: 'update_role', targetUserId: userId, payload: { role: newRole } });
            },
            { confirmText: t('admin_users.confirm.change_role_btn'), confirmVariant: 'primary' }
        );
    };

    const handleDeleteUser = (userId: string, userEmail: string) => {
        showConfirm(
            t('admin_users.confirm.delete_title'),
            t('admin_users.confirm.delete_desc', { email: userEmail }),
            () => {
                setProcessingId(userId);
                manageUserMutation.mutate({ action: 'delete_user', targetUserId: userId });
            },
            { confirmText: t('admin_users.confirm.delete_btn'), confirmVariant: 'danger' }
        );
    };

    const handleTerminateSessions = (userId: string) => {
        showConfirm(
            t('admin_users.confirm.terminate_title'),
            t('admin_users.confirm.terminate_desc'),
            () => {
                setProcessingId(userId);
                manageUserMutation.mutate(
                    { action: 'terminate_sessions', targetUserId: userId },
                    { onSuccess: () => showAlert(t('common.success'), t('admin_users.confirm.terminate_success'), 'success') }
                );
            },
            { confirmText: t('admin_users.confirm.terminate_btn'), confirmVariant: 'warning' }
        );
    };

    const openCityModal = (admin: AdminUser) => {
        if (!admin) return;
        setSelectedAdmin(admin);
        setAdminCities(admin.cities || []);
        setCityModalOpen(true);
    };

    const toggleCitySelection = (cityId: string) => setAdminCities(prev => prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]);

    const saveCityAssignments = () => {
        if (!selectedAdmin) return;
        setProcessingId(selectedAdmin.id);
        manageUserMutation.mutate({ action: 'update_cities', targetUserId: selectedAdmin.id, payload: { cities: adminCities } }, {
            onSuccess: () => setCityModalOpen(false)
        });
    };

    const openTabsModal = (admin: AdminUser) => {
        if (!admin) return;
        setSelectedAdmin(admin);
        setAdminTabs((admin.allowed_tabs as string[]) || ['dashboard']);
        setTabsModalOpen(true);
    };

    const toggleTabSelection = (tabKey: string) => setAdminTabs(prev => prev.includes(tabKey) ? prev.filter(t => t !== tabKey) : [...prev, tabKey]);

    const saveTabAssignments = () => {
        if (!selectedAdmin) return;
        setProcessingId(selectedAdmin.id);
        manageUserMutation.mutate({ action: 'update_tabs', targetUserId: selectedAdmin.id, payload: { tabs: adminTabs } }, {
            onSuccess: () => setTabsModalOpen(false)
        });
    };

    const openGiftModal = (user: { id: string; email: string }) => {
        if (!user) return;
        setSelectedUserForGift(user);
        setGiftModalOpen(true);
    };

    const grantMutation = useMutation({
        mutationFn: ({ userId, planName, days }: { userId: string; planName: string; days: number }) => adminUsersAPI.manageFinance('grant_subscription', { userId, plan_name: planName, days }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
            setGiftModalOpen(false);
            showAlert(t('common.success'), t('admin_users.confirm.grant_success'), 'success');
        },
        onError: (err: unknown) => showAlert(t('common.error'), err instanceof Error ? err.message : 'Error', 'error')
    });

    const revokeMutation = useMutation({
        mutationFn: (userId: string) => adminUsersAPI.manageFinance('revoke_subscription', { userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
            showAlert(t('common.success'), t('admin_users.confirm.revoke_success', 'Підписку успішно скасовано'), 'success');
        },
        onError: (err: unknown) => showAlert(t('common.error'), err instanceof Error ? err.message : 'Error', 'error')
    });

    const handleGrantSubscription = (userId: string, planName: string, days: number) => grantMutation.mutateAsync({ userId, planName, days });
    const handleRevokeSubscription = (userId: string) => revokeMutation.mutateAsync(userId);

    const userCounts = useMemo(() => {
        const counts = {
            all: users.length,
            super_admin: 0,
            admin: 0,
            user: 0,
            realtor: 0,
            premium: 0
        };
        users.forEach((u: any) => {
            if (u.role === 'super_admin') counts.super_admin++;
            if (u.role === 'admin') counts.admin++;
            if (u.role === 'user') counts.user++;
            if (u.plan === 'realtor' || (typeof u.plan === 'string' && u.plan.toLowerCase() === 'ріелтор')) counts.realtor++;
            if (u.plan === 'premium' || (typeof u.plan === 'string' && u.plan.toLowerCase() === 'преміум')) counts.premium++;
        });
        return counts;
    }, [users]);

    const processedUsers = useMemo(() => {
        let result = [...users];
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(u => (u.email && u.email.toLowerCase().includes(lowerTerm)) || (u.id && u.id.toLowerCase().includes(lowerTerm)));
        }
        result = result.filter((u: any) => {
            if (filterTab === 'all') return true;
            if (filterTab === 'super_admin') return u.role === 'super_admin';
            if (filterTab === 'admin') return u.role === 'admin';
            if (filterTab === 'user') return u.role === 'user';
            if (filterTab === 'realtor') return u.plan === 'realtor' || (typeof u.plan === 'string' && u.plan.toLowerCase() === 'ріелтор');
            if (filterTab === 'premium') return u.plan === 'premium' || (typeof u.plan === 'string' && u.plan.toLowerCase() === 'преміум');
            return true;
        });
        result.sort((a: any, b: any) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (sortConfig.key === 'role') {
                const weights: Record<string, number> = { super_admin: 3, admin: 2, user: 1 };
                aValue = weights[a.role] || 0;
                bValue = weights[b.role] || 0;
            }
            if (sortConfig.key === 'plan') {
                const weights: Record<string, number> = { realtor: 3, premium: 2, basic: 1, free: 1 };
                aValue = weights[a.plan] || 0;
                bValue = weights[b.plan] || 0;
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [users, searchTerm, sortConfig, filterTab]);

    return {
        loading, error, processingId, searchTerm, setSearchTerm, filterTab, setFilterTab, sortConfig,
        cityModalOpen, setCityModalOpen, giftModalOpen, setGiftModalOpen, promoModalOpen, setPromoModalOpen,
        tabsModalOpen, setTabsModalOpen, adminTabs, toggleTabSelection, saveTabAssignments, openTabsModal,
        selectedAdmin, availableCities, adminCities, toggleCitySelection, setAdminCities, saveCityAssignments,
        selectedUserForGift, processedUsers, userCounts, handleSort, handleRoleChange, handleDeleteUser, handleTerminateSessions,
        openCityModal, openGiftModal, handleGrantSubscription, handleRevokeSubscription, fetchUsers
    };
}