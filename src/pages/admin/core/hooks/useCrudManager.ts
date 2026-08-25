// src/pages/admin/core/hooks/useCrudManager.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useModals } from '@admin/core/context/ModalContext';
import { useActionLogger } from '@admin/core/context/useActionLogger';
import { useTranslation } from 'react-i18next';

export interface CrudOptions<T> {
    queryKey: string[];
    fetchFn: () => Promise<T[]>;
    createFn: (data: Omit<T, 'id'>) => Promise<unknown>;
    updateFn: (id: string | number, data: Partial<T>) => Promise<unknown>;
    deleteFn: (id: string | number) => Promise<unknown>;
    initialForm: T;
    entityName: string;
}

export function useCrudManager<T extends { id?: string | number }>(options: CrudOptions<T>) {
    const { t } = useTranslation('db');
    const { showConfirm, showAlert } = useModals();
    const { withLogging } = useActionLogger();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<T>(options.initialForm);

    const { data: items = [], isLoading, refetch } = useQuery({
        queryKey: options.queryKey,
        queryFn: options.fetchFn,
    });

    const saveMutation = useMutation({
        mutationFn: async (data: T) => {
            if (data.id && isEditing) {
                return await withLogging(`update_${options.entityName}`, () => options.updateFn(data.id!, data), { id: data.id, data });
            } else {
                return await withLogging(`create_${options.entityName}`, () => options.createFn(data), { data });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: options.queryKey });
            setIsModalOpen(false);
            showAlert(t('common.success'), t('common.save_success'), 'success');
        },
        onError: (error: unknown) => {
             const msg = error instanceof Error ? error.message : 'Error';
            showAlert(t('common.error'), msg, 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string | number) => {
            return await withLogging(`delete_${options.entityName}`, () => options.deleteFn(id), { id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: options.queryKey });
            showAlert(t('common.success'), t('common.success'), 'success');
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : 'Error';
            showAlert(t('common.error'), msg, 'error');
        }
    });

    const handleEdit = (item: T) => {
        setFormData(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData(options.initialForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string | number) => {
        showConfirm(
            t('common.confirm_delete_title'),
            t('common.confirm_delete'),
            () => deleteMutation.mutate(id),
            { confirmVariant: 'danger' }
        );
    };

    return {
        items,
        isLoading,
        isModalOpen,
        setIsModalOpen,
        isEditing,
        formData,
        setFormData,
        handleEdit,
        handleAddNew,
        handleDelete,
        saveMutation,
        refetch
    };
}