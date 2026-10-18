import { useTranslation } from 'react-i18next';
import Loader from '@components/loader/Loader';
import SeoMeta from '@seo/SeoMeta';
import { useSubscriptionPage } from './hooks/useSubscriptionPage';
import { PlanSelector } from './components/PlanSelector';
import { PlanDetailsCard } from './components/PlanDetailsCard';

export default function Subscription() {
  const { t } = useTranslation('db');
  
  const {
    subscription,
    isLoading,
    selectedPlan,
    setSelectedPlan,
    hasActivePaidSubscription,
    handlePlanSelection
  } = useSubscriptionPage();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  const isThisPlanActive = subscription?.plan === selectedPlan && !subscription.isExpired;

  return (
    <div className="min-h-screen bg-body text-textMain py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center">
      <SeoMeta title={t('subscription.seo.title')} description={t('subscription.seo.desc')} />
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] max-w-[800px] h-[50vw] max-h-[500px] bg-accent/15 blur-[120px] sm:blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto animate-slide-up-fade">
        <h1 className="ui-heading-1 mb-4 sm:mb-6">
          {t('subscription.page_title')}
        </h1>
        <p className="ui-text-muted">
          {t('subscription.page_subtitle')}
        </p>
      </div>
      
      <div className="flex flex-col gap-8 sm:gap-12 items-center max-w-5xl mx-auto w-full animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
        <PlanSelector 
          selectedPlan={selectedPlan} 
          onSelectPlan={setSelectedPlan} 
        />
        
        <PlanDetailsCard 
          selectedPlan={selectedPlan}
          isThisPlanActive={isThisPlanActive}
          hasActivePaidSubscription={hasActivePaidSubscription}
          onPlanSelection={handlePlanSelection}
        />
      </div>
    </div>
  );
}