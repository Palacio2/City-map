import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { HeaderSection, ModalFooter } from './modal/HeaderFooter';
import { StatsGrid } from './modal/StatsGrid';
import { formatNumber, formatPrice, getCurrencyInfo } from '@utils/formatters';
import { trackDistrictVisit } from '@api/statsApi';
import { useSubscription } from '@subscription/SubscriptionContext';
import { usePdfExport } from '@hooks/usePdfExport';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useImageToBase64 } from '@hooks/useImageToBase64'; 
import DistrictPdfTemplate from './DistrictPdfTemplate';
import DistrictGeoMapModal from './DistrictGeoMapModal';
import SeoMeta from '@components/seo/SeoMeta';
import { TransformedDistrict } from '@utils/dataTransformers';

interface DistrictDetailsModalProps {
  readonly district: TransformedDistrict | null;
  readonly selectedCategory: string | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function DistrictDetailsModal({ 
  district, 
  selectedCategory, 
  isOpen, 
  onClose 
}: DistrictDetailsModalProps) {
  const { t } = useTranslation('db');
  const { country: paramCountry, city: paramCity } = useParams();
  
  const { isRealtor, isFree } = useSubscription();
  const fileName = district ? `${district.name}_report` : 'district_report';
  const { isDownloading, downloadPdf } = usePdfExport(fileName);
  
  const pdfPhoto = useImageToBase64(district?.photo_url);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const effectiveCountry = paramCountry || district?.country || (district as any)?.cities?.countries?.name;
  const currencyInfo = getCurrencyInfo(effectiveCountry);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (district && isOpen) { 
      trackDistrictVisit(district); 
    }
  }, [district, isOpen]);

  if (!isOpen || !district) return null;

  const districtTitle = `${district.name}, ${paramCity || ''}`;
  const districtDesc = t('district.seo.description', { 
    district: district.name, 
    city: paramCity || '', 
  });

  const modalContent = (
    <>
      <SeoMeta title={districtTitle} description={districtDesc} />
      
      <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-[var(--glass-blur)] z-[2000] flex items-center justify-center p-6 md:p-8 animate-fadeInOverlay">
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-transparent border-none appearance-none cursor-default z-0"
          onClick={onClose}
          aria-label={t('district.actions.close')}
          tabIndex={-1}
        />
        
        <dialog 
          open
          className="bg-[var(--bg-surface)] rounded-3xl w-full max-w-[1000px] h-auto max-h-[85dvh] md:max-h-[90dvh] flex flex-col relative overflow-hidden border border-[var(--border-color)] shadow-[0_10px_40px_rgba(0,0,0,0.4)] md:shadow-modal animate-slideUpModal m-0 p-0 z-10" 
          onClick={e => e.stopPropagation()} 
          aria-labelledby="district-modal-title"
        >
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

          <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-8 bg-[var(--bg-body)] scrollbar-thin scrollbar-thumb-[var(--border-color)] hover:scrollbar-thumb-[var(--accent-color)] scrollbar-track-transparent">
            {district.filterData ? (
             <StatsGrid 
                filterData={district.filterData} 
                currencyInfo={currencyInfo}
                selectedCategory={selectedCategory} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-16 px-8 text-center text-[var(--text-secondary)] h-full">
                <div className="text-5xl mb-4 opacity-50 grayscale">📊</div>
                <h3 id="district-modal-title">{t('district.status.no_data_title')}</h3>
                <p>{t('district.status.no_data_text')}</p>
              </div>
            )}
          </div>

          <ModalFooter onClose={onClose} />
        </dialog>
      </div>

      <DistrictGeoMapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        districtId={district.id}
        districtName={district.name}
      />

      {!isFree && (
        <div id="district-pdf-container" className="fixed -left-[10000px] top-0 -z-10 w-[794px]">
          <DistrictPdfTemplate 
             district={district}
             photoOverride={pdfPhoto}
             currencyInfo={currencyInfo}
             isRealtor={isRealtor}
          />
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}