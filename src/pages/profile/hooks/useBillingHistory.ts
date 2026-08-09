import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchUserBillingHistory, cancelUserSubscription } from '../api/billingApi';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { mapSupabaseError } from '@utils/errorHandler';

const ITEMS_PER_PAGE = 5;

export const useBillingHistory = () => {
  const { t } = useTranslation('db');
  const queryClient = useQueryClient();
  const { subscription, updateSubscription, isLoading: isSubLoading } = useSubscription();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['billingHistory', currentPage],
    queryFn: () => fetchUserBillingHistory(currentPage, ITEMS_PER_PAGE),
    staleTime: 5 * 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      let subId = subscription?.id;
      if (!subId && data?.subscriptions) {
        const activeSub = data.subscriptions.find((s) => s.status === 'active');
        if (activeSub) subId = activeSub.id;
      }
      if (!subId) throw new Error('Active Subscription ID not found');
      await cancelUserSubscription(String(subId));
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
    cancelMutation.mutate();
  }, [cancelMutation]);

  const toggleModal = useCallback((show: boolean) => {
    setShowCancelModal(show);
    if (!show) setCancellationError(null);
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
    isCancelling: cancelMutation.isPending,
    cancellationError,
    subscription,
    isSubLoading,
    t
  };
};