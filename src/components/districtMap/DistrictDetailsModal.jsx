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
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import DistrictPdfTemplate from './DistrictPdfTemplate';
import DistrictGeoMapModal from './DistrictGeoMapModal';
import SeoMeta from '@components/seo/SeoMeta'; // ДОДАНО: Імпорт SEO

export default function DistrictDetailsModal({ district, selectedCategory, isOpen, onClose }) {
  const { t } = useTranslation('districts');
  const { country: paramCountry, city: paramCity } = useParams();
  
  const { isRealtor, isFree } = useSubscription();
  const fileName = district ? `${district.name}_report` : 'district_report';
  const { isDownloading, downloadPdf } = usePdfExport(fileName);
  
  const [pdfPhoto, setPdfPhoto] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const effectiveCountry = paramCountry || district?.country || district?.cities?.countries?.name;
  const currencyInfo = getCurrencyInfo(effectiveCountry);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (district && isOpen) { trackDistrictVisit(district); }
  }, [district?.id, isOpen]);

  useEffect(() => {
    let isMounted = true;

    if (district?.photo_url) {
      const loadBase64Image = async () => {
        try {
          const response = await fetch(district.photo_url, { mode: 'cors' }).catch(() => null);
          
          if (response && response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              if (isMounted) setPdfPhoto(reader.result);
            };
            reader.readAsDataURL(blob);
          } else {
            if (isMounted) setPdfPhoto('error');
          }
        } catch {
          if (isMounted) setPdfPhoto('error');
        }
      };
      loadBase64Image();
    }

    return () => { isMounted = false; };
  }, [district?.photo_url]);

  if (!isOpen || !district) return null;

  const districtTitle = `${district.name}, ${paramCity || ''} | City Maps`;
  const districtDesc = t('seo.districtDesc', { 
    district: district.name, 
    city: paramCity || '', 
  });

  const modalContent = (
    <>
      <SeoMeta title={districtTitle} description={districtDesc} />
      
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
            onOpenMap={() => setIsMapOpen(true)}
          />

          <div className={styles.mainContent}>
            {district.filterData ? (
             <StatsGrid 
                filterData={district.filterData} 
                currencyInfo={currencyInfo}
                isFree={isFree}
                isRealtor={isRealtor}
                selectedCategory={selectedCategory} 
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

      <DistrictGeoMapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        districtId={district.id}
        districtName={district.name}
      />

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