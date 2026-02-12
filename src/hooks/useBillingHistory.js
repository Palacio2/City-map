import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUserBillingHistory, cancelUserSubscription } from '@api/billingApi';
import { useSubscription } from '@subscription/SubscriptionContext';

const ITEMS_PER_PAGE = 5;

export const useBillingHistory = () => {
  // Підключаємо всі три файли: profile (загальне), subscription (назви планів), billing (сторінка)
  const { t } = useTranslation(['profile', 'subscription', 'billing']);
  const { subscription, updateSubscription, isLoading: isSubLoading } = useSubscription();
  
  const [state, setState] = useState({
    history: [],
    totalCount: 0,
    isLoading: true,
    error: null,
    currentPage: 1,
    isCancelling: false,
    showCancelModal: false,
    cancellationError: null
  });

  const [expandedItems, setExpandedItems] = useState({});

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }), []);

  const loadBillingData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { subscriptions, count } = await fetchUserBillingHistory(state.currentPage, ITEMS_PER_PAGE);
      setState(prev => ({ 
        ...prev, 
        history: subscriptions || [], 
        totalCount: count,
        isLoading: false 
      }));
    } catch (e) {
      setState(prev => ({ 
        ...prev, 
        error: t('billing:error_load'), // З billing.json
        isLoading: false 
      }));
    }
  }, [state.currentPage, t]);

  useEffect(() => { loadBillingData(); }, [loadBillingData]);

  const confirmCancellation = async () => {
    if (state.isCancelling) return;
    setState(prev => ({ ...prev, isCancelling: true, cancellationError: null }));

    try {
      let subId = subscription.id;
      if (!subId) {
        const activeSub = state.history.find(s => s.status === 'active');
        if (activeSub) subId = activeSub.id;
      }
      if (!subId) throw new Error('Active Subscription ID not found');

      await cancelUserSubscription(subId);
      await updateSubscription(); 
      await loadBillingData();
      setState(prev => ({ ...prev, showCancelModal: false, isCancelling: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isCancelling: false, 
        cancellationError: error.message || t('billing:error_cancel') // З billing.json
      }));
    }
  };

  const toggleModal = (show) => setState(prev => ({ ...prev, showCancelModal: show }));
  const toggleRow = (id) => setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  const setPage = (page) => setState(prev => ({ ...prev, currentPage: page }));

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