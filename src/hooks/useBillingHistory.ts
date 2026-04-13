import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUserBillingHistory, cancelUserSubscription } from '@api/billingApi';
import { useSubscription } from '@subscription/SubscriptionContext';

const ITEMS_PER_PAGE = 5;

interface BillingState {
  history: any[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  isCancelling: boolean;
  showCancelModal: boolean;
  cancellationError: string | null;
}

export const useBillingHistory = () => {
  const { t, i18n } = useTranslation('billing');
  const { subscription, updateSubscription, isLoading: isSubLoading } = useSubscription();
  
  const [state, setState] = useState<BillingState>({
    history: [],
    totalCount: 0,
    isLoading: true,
    error: null,
    currentPage: 1,
    isCancelling: false,
    showCancelModal: false,
    cancellationError: null
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const dateFormatter = useMemo(() => {
    const lang = i18n.language || 'uk-UA';
    return new Intl.DateTimeFormat(lang, {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    });
  }, [i18n.language]);

  const loadBillingData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { subscriptions, count } = await fetchUserBillingHistory(state.currentPage, ITEMS_PER_PAGE);
      setState(prev => ({ 
        ...prev, 
        history: subscriptions || [], 
        // ВИПРАВЛЕНО: Додано fallback до 0, якщо count === null
        totalCount: count || 0,
        isLoading: false 
      }));
    } catch {
      setState(prev => ({ 
        ...prev, 
        error: t('error_load'), 
        isLoading: false 
      }));
    }
  }, [state.currentPage, t]);

  useEffect(() => { 
    loadBillingData(); 
  }, [loadBillingData]);

  const confirmCancellation = async () => {
    if (state.isCancelling) return;
    setState(prev => ({ ...prev, isCancelling: true, cancellationError: null }));

    try {
      let subId = subscription?.id;
      if (!subId) {
        const activeSub = state.history.find(s => s.status === 'active');
        if (activeSub) subId = activeSub.id;
      }
      if (!subId) throw new Error('Active Subscription ID not found');

      await cancelUserSubscription(subId);
      await updateSubscription(); 
      await loadBillingData();
      setState(prev => ({ ...prev, showCancelModal: false, isCancelling: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isCancelling: false, 
        cancellationError: error?.message || t('error_cancel') 
      }));
    }
  };

  const toggleModal = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showCancelModal: show }));
  }, []);

  const toggleRow = useCallback((id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  return {
    ...state,
    subscription,
    isSubLoading,
    expandedItems,
    dateFormatter,
    confirmCancellation,
    toggleModal,
    toggleRow,
    setPage,
    t
  };
};