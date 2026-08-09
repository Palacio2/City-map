import { useTranslation } from 'react-i18next';
import Loader from '@components/loader/Loader';
import SeoMeta from '@/components/seo/SeoMeta';
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
    <div className="min-h-[100vh] bg-body text-textMain py-12 px-6 font-body">
      <SeoMeta title={t('subscription.seo.title')} description={t('subscription.seo.desc')} />
      
      <div className="text-center mb-12 max-w-[800px] mx-auto">
        <h1 className="font-heading text-4xl text-accent mb-4 inline-block font-bold">
          {t('subscription.page_title')}
        </h1>
        <p className="text-textSecondary text-lg leading-relaxed">
          {t('subscription.page_subtitle')}
        </p>
      </div>
      
      <div className="flex flex-col gap-8 items-center max-w-[1000px] mx-auto w-full">
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