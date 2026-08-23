// src/pages/admin/features/feedback/comments/useComments.ts
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllComments, hideComment, deleteComment, DistrictComment } from '@/components/stats/api/commentsApi';
import { useModals } from '@admin/core/context/ModalContext';
import { api } from '@services/api';
import { adminUsersAPI } from '@admin/features/users/adminUsersAPI';
import { useActionLogger } from '@admin/core/context/useActionLogger';

export const useComments = () => {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const { withLogging } = useActionLogger();
    const queryClient = useQueryClient();

    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    const { data: cities = [] } = useQuery<{id: string, name: string}[]>({
        queryKey: ['citiesList'],
        queryFn: () => api.geo.getAllCities()
    });

    const { data: districts = [], isLoading: districtsLoading } = useQuery<{id: string, name: string}[]>({
        queryKey: ['districtsList', selectedCity],
        queryFn: () => api.geo.getDistricts(selectedCity),
        enabled: !!selectedCity
    });

    const { data: commentsData, isLoading, refetch: loadData } = useQuery({
        queryKey: ['allComments'],
        queryFn: async () => {
            const [commentsRes, usersRes] = await Promise.all([
                fetchAllComments(),
                adminUsersAPI.getUsers()
            ]);
            const map: Record<string, { email: string, role: string }> = {};
            if (usersRes && Array.isArray(usersRes)) {
                usersRes.forEach((u: { id: string, email: string, role: string }) => { 
                    map[u.id] = { email: u.email, role: u.role }; 
                });
            }
            return { comments: (commentsRes || []) as DistrictComment[], usersMap: map };
        }
    });

    // Беремо напряму без створення нового масиву
    const comments = commentsData?.comments;
    const usersMap = commentsData?.usersMap || {};

    const toggleMutation = useMutation({
        mutationFn: ({ id, hidden }: { id: string, hidden: boolean }) =>
            withLogging('toggle_comment_visibility', () => hideComment(id, hidden), { id, hidden }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allComments'] }),
        onError: (err: unknown) => showAlert(t('common.error'), err instanceof Error ? err.message : 'Error', 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => withLogging('delete_comment', () => deleteComment(id), { id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allComments'] });
            showAlert(t('common.success'), t('admin_comments.tab.delete_success'), 'success');
        },
        onError: (err: unknown) => showAlert(t('common.error'), err instanceof Error ? err.message : 'Error', 'error')
    });

    const handleToggleHide = (id: string, currentHidden: boolean) => {
        toggleMutation.mutate({ id, hidden: !currentHidden });
    };

    const handleDelete = (id: string) => {
        showConfirm(
            t('admin_comments.tab.delete_title'),
            t('admin_comments.tab.delete_desc'),
            () => deleteMutation.mutate(id),
            { confirmVariant: 'danger', confirmText: t('admin_comments.tab.delete_btn') }
        );
    };

    const filteredComments = useMemo(() => {
        const safeComments = comments || [];
        if (!selectedCity && !selectedDistrict) return safeComments;
        if (selectedDistrict) return safeComments.filter((c) => c.district_id === selectedDistrict);
        if (selectedCity && districts.length > 0) {
            const validDistrictIds = new Set(districts.map((d) => d.id));
            return safeComments.filter((c) => validDistrictIds.has(c.district_id));
        }
        return safeComments;
    }, [comments, selectedCity, selectedDistrict, districts]);

    return {
        comments: filteredComments,
        usersMap,
        loading: isLoading,
        loadData,
        handleToggleHide,
        handleDelete,
        cities,
        districts,
        selectedCity,
        setSelectedCity,
        selectedDistrict,
        setSelectedDistrict,
        districtsLoading
    };
};