import { useEffect, useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { usePdfExport } from '@hooks/usePdfExport';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useImageToBase64 } from '@hooks/useImageToBase64';
import { trackDistrictVisit } from '@/components/stats/api/statsApi';
import SeoMeta from '@seo/SeoMeta';
import { HeaderSection, ModalFooter } from './ModalHeaderFooter';
import { StatsGrid } from './StatsGrid';
import { DistrictComments } from './DistrictComments';
import type { TransformedDistrict } from '@utils/dataTransformers';

const DistrictGeoMapModal = lazy(() => import('./DistrictGeoMapModal'));
const DistrictPdfTemplate = lazy(() => import('./DistrictPdfTemplate'));

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
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [cachedDistrict, setCachedDistrict] = useState(district);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsAnimatingOut(false);
      setCachedDistrict(district);
    } else if (shouldRender) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsAnimatingOut(false);
      }, 400); // 400ms is the duration of our animations
      return () => clearTimeout(timer);
    }
  }, [isOpen, district, shouldRender]);

  const districtId = district?.id;
  useEffect(() => {
    if (isOpen && districtId != null) {
      trackDistrictVisit({ id: districtId, city: district?.city, country: district?.country } as TransformedDistrict).catch(console.error);
    }
  }, [isOpen, districtId, district?.city, district?.country]);

  const { t } = useTranslation('db');
  const { city: paramCity } = useParams<{ city: string }>();
  const { isRealtor, isFree } = useSubscription();
  
  const currentDistrict = district || cachedDistrict;
  const fileName = currentDistrict ? `${currentDistrict.name || 'report'}_report` : 'district_report';
  const { isDownloading, downloadPdf } = usePdfExport(fileName);
  const pdfPhoto = useImageToBase64(currentDistrict?.photo_url || null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  useBodyScrollLock(shouldRender);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!shouldRender || !currentDistrict) return null;

  const districtTitle = `${currentDistrict.name || ''}, ${paramCity || ''}`;
  const districtDesc = t('district.seo.description', {
    district: currentDistrict.name,
    city: paramCity || '',
  });

  const modalContent = (
    <>
      <SeoMeta title={districtTitle} description={districtDesc} />
      <style>{`
        @keyframes slideUpMobile {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideDownMobile {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
        @keyframes fadeOutOverlay {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideDownModal {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(16px) scale(0.98); }
        }
        .animate-slideUpMobile {
          animation: slideUpMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideDownMobile {
          animation: slideDownMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fadeOutOverlay {
          animation: fadeOutOverlay 0.4s ease-in-out forwards;
        }
        .animate-slideDownModal {
          animation: slideDownModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className={`fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-[var(--glass-blur)] z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8 ${isAnimatingOut ? 'animate-fadeOutOverlay' : 'animate-fadeInOverlay'}`}>
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-transparent border-none appearance-none cursor-default z-0"
          onClick={onClose}
          aria-label={t('district.actions.close', 'Закрити')}
          tabIndex={-1}
        />
        <dialog
          open
          className={`bg-surface rounded-t-3xl rounded-b-none sm:rounded-3xl w-full max-w-[1000px] h-[90dvh] sm:h-auto sm:max-h-[85dvh] md:max-h-[90dvh] flex flex-col relative overflow-hidden border border-borderClient shadow-[0_-10px_40px_rgba(0,0,0,0.3)] sm:shadow-[0_10px_40px_rgba(0,0,0,0.4)] md:shadow-modal m-0 p-0 z-10 ${
            isAnimatingOut
              ? 'animate-slideDownMobile sm:animate-slideDownModal'
              : 'animate-slideUpMobile sm:animate-slideUpModal'
          }`}
          onClick={e => e.stopPropagation()}
          aria-labelledby="district-modal-title"
        >
          <HeaderSection
            district={currentDistrict}
            updatedAt={currentDistrict.updated_at}
            filterData={currentDistrict.filterData}
            onClose={onClose}
            isRealtor={isRealtor}
            isFree={isFree}
            onDownloadPdf={() => downloadPdf('district-pdf-container')}
            isDownloading={isDownloading}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenComments={() => setIsCommentsOpen(true)}
          />
          
          {isCommentsOpen ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-8 bg-body custom-scrollbar relative">
              <div className="flex items-center gap-3 mb-6 border-b border-borderClient pb-4">
                <button 
                  onClick={() => setIsCommentsOpen(false)}
                  className="w-8 h-8 rounded-full bg-body border border-borderClient flex items-center justify-center text-textSecondary hover:text-textMain hover:bg-hover transition-colors"
                  aria-label={t('common.actions.close_text')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <h2 className="text-lg sm:text-xl font-heading font-semibold text-textMain m-0">{t('comments.title')}</h2>
              </div>
              <DistrictComments districtId={String(currentDistrict.id)} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 md:p-8 bg-body custom-scrollbar relative">
              {currentDistrict.filterData ? (
                <StatsGrid
                  country={currentDistrict.country}
                  filterData={currentDistrict.filterData}
                  selectedCategory={selectedCategory}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-16 px-8 text-center text-textSecondary h-full">
                  <div className="text-5xl mb-4 opacity-50 grayscale">📊</div>
                  <h3 id="district-modal-title" className="m-0 font-heading text-xl text-textMain">{t('district.status.no_data_title')}</h3>
                  <p className="m-0 mt-2">{t('district.status.no_data_text')}</p>
                </div>
              )}
            </div>
          )}
          <ModalFooter onClose={onClose} />
        </dialog>
      </div>

      <Suspense fallback={null}>
        {isMapOpen && district && (
          <DistrictGeoMapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            districtId={district.id}
            districtName={district.name}
          />
        )}
      </Suspense>

      {!isFree && (
        <Suspense fallback={null}>
          <div id="district-pdf-container" className="fixed -left-[10000px] top-0 -z-10 w-[794px]">
            <DistrictPdfTemplate
               district={district}
               photoOverride={pdfPhoto}
               isRealtor={isRealtor}
            />
          </div>
        </Suspense>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
