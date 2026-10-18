import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchUserBillingHistory, cancelUserSubscription } from '../api/billingApi';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { mapSupabaseError } from '@utils/errorHandler';

const ITEMS_PER_PAGE = 5;

export const useBillingHistory = (enabled = true) => {
  const { t } = useTranslation('db');
  const queryClient = useQueryClient();
  const { subscription, updateSubscription, isLoading: isSubLoading } = useSubscription();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['billingHistory', currentPage],
    queryFn: ({ signal }) => fetchUserBillingHistory(currentPage, ITEMS_PER_PAGE, signal),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const paid = subscription.paidSubscriptions?.find(item => item.id === id);
      if (!paid || paid.cancel_at) throw new Error('No cancellable paid subscription selected');
      await cancelUserSubscription(id);
    },
    onSuccess: async () => {
      await updateSubscription();
      queryClient.invalidateQueries({ queryKey: ['billingHistory'] });
      setShowCancelModal(false);
      setCancellationError(null);
    },
    onError: (error: unknown) => {
      setCancellationError(mapSupabaseError(error, t) || t('billing.errors.cancel'));
    }
  });

  const confirmCancellation = useCallback(() => {
    if (selectedSubscriptionId && !cancelMutation.isPending) cancelMutation.mutate(selectedSubscriptionId);
  }, [cancelMutation, selectedSubscriptionId]);

  const selectSubscriptionForCancellation = (id: string) => {
    setSelectedSubscriptionId(id);
    setCancellationError(null);
    setShowCancelModal(true);
  };

  const toggleModal = useCallback((show: boolean) => {
    setShowCancelModal(show);
    if (!show) { setCancellationError(null); setSelectedSubscriptionId(null); }
  }, []);

  const toggleRow = useCallback((id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return {
    history: data?.subscriptions || [],
    totalCount: data?.count || 0,
    isLoading,
    isError,
    currentPage,
    setPage: setCurrentPage,
    expandedItems,
    toggleRow,
    showCancelModal,
    toggleModal,
    confirmCancellation,
    selectSubscriptionForCancellation,
    isCancelling: cancelMutation.isPending,
    cancellationError,
    subscription,
    isSubLoading,
    t
  };
};
