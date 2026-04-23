import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@supabaseClient';
import { useModals } from '../../ui/ModalContext';
import { adminUsersAPI } from '@api/adminUsersAPI'; 

export function useUsersManager(currentAdmin, t) {
    const { showConfirm, showAlert } = useModals();
    const queryClient = useQueryClient();

    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all'); 
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    
    const [cityModalOpen, setCityModalOpen] = useState(false);
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [selectedUserForGift, setSelectedUserForGift] = useState(null);
    const [adminCities, setAdminCities] = useState([]);

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
            const { data, error } = await supabase.functions.invoke('admin-users-list', { method: 'POST' });
            if (error) throw error;
            return data.users || [];
        }
    });

    const error = queryError?.message || null;

    const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    const manageUserMutation = useMutation({
        mutationFn: async ({ action, targetUserId, payload }) => {
            const { data, error } = await supabase.functions.invoke('admin-users-manage', {
                method: 'POST',
                body: { action, targetUserId, payload }
            });
            if (error || data?.error) throw new Error(error?.message || data?.error);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries(['adminUsersList']),
        onError: (err) => showAlert(t('common.error'), err.message, 'error'),
        onSettled: () => setProcessingId(null)
    });

    const handleRoleChange = (userId, newRole) => {
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

    const handleDeleteUser = (userId, userEmail) => {
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

    const handleTerminateSessions = (userId) => {
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

    const openCityModal = (admin) => {
        if (!admin) return;
        setSelectedAdmin(admin);
        setAdminCities(admin.cities || []);
        setCityModalOpen(true);
    };

    const toggleCitySelection = (cityId) => setAdminCities(prev => prev.includes(cityId) ? prev.filter(id => id !== cityId) : [...prev, cityId]);

    const saveCityAssignments = () => {
        if (!selectedAdmin) return;
        setProcessingId(selectedAdmin.id);
        manageUserMutation.mutate({ action: 'update_cities', targetUserId: selectedAdmin.id, payload: { cities: adminCities } }, {
            onSuccess: () => setCityModalOpen(false)
        });
    };

    const openGiftModal = (user) => {
        if (!user) return;
        setSelectedUserForGift(user);
        setGiftModalOpen(true);
    };

    const grantMutation = useMutation({
        mutationFn: ({ userId, planName, days }) => adminUsersAPI.manageFinance('grant_subscription', { userId, plan_name: planName, days }),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsersList']);
            setGiftModalOpen(false);
            showAlert(t('common.success'), t('admin_users.confirm.grant_success'), 'success');
        },
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const handleGrantSubscription = (userId, planName, days) => grantMutation.mutate({ userId, planName, days });

    const processedUsers = useMemo(() => {
        let result = [...users];
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(u => (u.email && u.email.toLowerCase().includes(lowerTerm)) || (u.id && u.id.toLowerCase().includes(lowerTerm)));
        }
        result = result.filter(u => {
            if (filterTab === 'all') return true;
            if (filterTab === 'super_admin') return u.role === 'super_admin';
            if (filterTab === 'admin') return u.role === 'admin';
            if (filterTab === 'user') return u.role === 'user';
            if (filterTab === 'premium') return u.plan === 'premium' || u.plan === 'realtor';
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

    return {
        loading, error, processingId, searchTerm, setSearchTerm, filterTab, setFilterTab, sortConfig,
        cityModalOpen, setCityModalOpen, giftModalOpen, setGiftModalOpen, promoModalOpen, setPromoModalOpen,
        selectedAdmin, availableCities, adminCities, toggleCitySelection, setAdminCities, saveCityAssignments,
        selectedUserForGift, processedUsers, handleSort, handleRoleChange, handleDeleteUser, handleTerminateSessions, 
        openCityModal, openGiftModal, handleGrantSubscription, fetchUsers
    };
}