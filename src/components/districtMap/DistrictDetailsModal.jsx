import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styles from './DistrictDetailsModal.module.css';
import { HeaderSection, ModalFooter } from './modal/HeaderFooter';
import StatsGrid from './modal/StatsGrid';
import { checkIsFavorite, toggleFavorite } from '@utils/favorites';
import { formatNumber, formatPrice, getCurrencyInfo } from '@utils/formatters';
import { trackDistrictVisit } from '@api/statsApi';
import { useSubscription } from '@subscription/SubscriptionContext';
import { usePdfExport } from '@hooks/usePdfExport';
import DistrictPdfTemplate from './DistrictPdfTemplate';

export default function DistrictDetailsModal({ 
  district, 
  isOpen, 
  onClose, 
  onToggleFavorite 
}) {
  const { t } = useTranslation('districts');
  const { country: paramCountry } = useParams();
  
  const { isRealtor, isFree } = useSubscription();
  const fileName = district ? `${district.name}_report` : 'district_report';
  const { isDownloading, downloadPdf } = usePdfExport(fileName);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currencyInfo = getCurrencyInfo(paramCountry);

  useEffect(() => {
    if (district && isOpen) {
      trackDistrictVisit(district.id);
      
      const checkStatus = async () => {
        setIsLoading(true);
        const status = await checkIsFavorite(district.id);
        setIsFavorite(status);
        setIsLoading(false);
      };
      checkStatus();
    }
  }, [district, isOpen]);

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      const newStatus = await toggleFavorite(district.id);
      setIsFavorite(newStatus);
      onToggleFavorite?.(district.id, newStatus);
    } catch (e) {
      if (e.message && e.message.includes('увійдіть')) {
          alert(t('modal.login_alert') || "Будь ласка, увійдіть в акаунт");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !district) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <HeaderSection 
            district={district}
            updatedAt={district.updated_at}
            filterData={district.filterData}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            isLoading={isLoading}
            onClose={onClose}
            formatPrice={formatPrice}
            formatNumber={formatNumber}
            currencyInfo={currencyInfo}
            isRealtor={isRealtor} 
            isFree={isFree}
            onDownloadPdf={() => downloadPdf('district-pdf-container')}
            isDownloading={isDownloading}
          />

          <div className={styles.mainContent}>
            {district.filterData ? (
             <StatsGrid 
      filterData={district.filterData} 
      currencyInfo={currencyInfo}
      isFree={isFree}
      isRealtor={isRealtor}
    />
            ) : (
              <div className={styles.noData}>
                <div className={styles.noDataIcon}>📊</div>
                <h3>{t('modal.no_data_title')}</h3>
                <p>{t('modal.no_data_text')}</p>
              </div>
            )}
          </div>

          <ModalFooter onClose={onClose} />
        </div>
      </div>

      {!isFree && (
        <div id="district-pdf-container" className={styles.hiddenPdfTemplate}>
          <DistrictPdfTemplate 
             district={district}
             currencyInfo={currencyInfo}
             formatNumber={formatNumber}
             formatPrice={formatPrice}
             isRealtor={isRealtor}
          />
        </div>
      )}
    </>
  );
}