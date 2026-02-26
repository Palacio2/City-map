import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styles from './DistrictDetailsModal.module.css';
import { HeaderSection, ModalFooter } from './modal/HeaderFooter';
import StatsGrid from './modal/StatsGrid';
import { formatNumber, formatPrice, getCurrencyInfo } from '@utils/formatters';
import { trackDistrictVisit } from '@api/statsApi';
import { useSubscription } from '@subscription/SubscriptionContext';
import { usePdfExport } from '@hooks/usePdfExport';
import DistrictPdfTemplate from './DistrictPdfTemplate';

// ОНОВЛЕНО: Приймаємо selectedCategory
export default function DistrictDetailsModal({ district, selectedCategory, isOpen, onClose }) {
  const { t } = useTranslation('districts');
  const { country: paramCountry } = useParams();
  
  const { isRealtor, isFree } = useSubscription();
  const fileName = district ? `${district.name}_report` : 'district_report';
  const { isDownloading, downloadPdf } = usePdfExport(fileName);
  
  const [pdfPhoto, setPdfPhoto] = useState(null);

  const effectiveCountry = paramCountry || district?.country || district?.cities?.countries?.name;
  const currencyInfo = getCurrencyInfo(effectiveCountry);

  useEffect(() => {
    if (district && isOpen) {
      trackDistrictVisit(district); 
    }
  }, [district?.id, isOpen]);

  useEffect(() => {
    if (district?.photo_url) {
      const loadBase64Image = async () => {
        try {
          let response = await fetch(district.photo_url, { mode: 'cors' }).catch(() => null);
          
          if (!response || !response.ok) {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(district.photo_url)}`;
            response = await fetch(proxyUrl);
          }
          
          if (response && response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => setPdfPhoto(reader.result);
            reader.readAsDataURL(blob);
          } else {
            setPdfPhoto('error');
          }
        } catch (error) {
          setPdfPhoto('error');
        }
      };
      loadBase64Image();
    }
  }, [district?.photo_url]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !district) return null;

  const modalContent = (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <HeaderSection 
            district={district}
            updatedAt={district.updated_at}
            filterData={district.filterData}
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
                selectedCategory={selectedCategory} // ПЕРЕДАЄМО СЮДИ
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
             photoOverride={pdfPhoto}
             currencyInfo={currencyInfo}
             formatNumber={formatNumber}
             formatPrice={formatPrice}
             isRealtor={isRealtor}
          />
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}