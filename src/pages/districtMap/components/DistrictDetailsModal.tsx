import { useEffect, useState, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { usePdfExport } from '@hooks/usePdfExport';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useImageToBase64 } from '@hooks/useImageToBase64';
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
  const { t } = useTranslation('db');
  const { city: paramCity } = useParams<{ city: string }>();
  const { isRealtor, isFree } = useSubscription();
  const fileName = district ? `${district.name || 'report'}_report` : 'district_report';
  const { isDownloading, downloadPdf } = usePdfExport(fileName);
  const pdfPhoto = useImageToBase64(district?.photo_url || null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !district) return null;

  const districtTitle = `${district.name || ''}, ${paramCity || ''}`;
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
          className="bg-surface rounded-3xl w-full max-w-[1000px] h-auto max-h-[85dvh] md:max-h-[90dvh] flex flex-col relative overflow-hidden border border-borderClient shadow-[0_10px_40px_rgba(0,0,0,0.4)] md:shadow-modal animate-slideUpModal m-0 p-0 z-10"
          onClick={e => e.stopPropagation()}
          aria-labelledby="district-modal-title"
        >
          <HeaderSection
            district={district}
            updatedAt={district.updated_at}
            filterData={district.filterData}
            onClose={onClose}
            isRealtor={isRealtor}
            isFree={isFree}
            onDownloadPdf={() => downloadPdf('district-pdf-container')}
            isDownloading={isDownloading}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenComments={() => setIsCommentsOpen(true)}
          />
          
          {isCommentsOpen ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-8 bg-body custom-scrollbar relative">
              <div className="flex justify-between items-center mb-6 border-b border-borderClient pb-4">
                <h2 className="text-xl font-heading font-semibold text-textMain">{t('comments.title')}</h2>
                <button 
                  onClick={() => setIsCommentsOpen(false)}
                  className="text-textSecondary hover:text-textMain transition-colors"
                >
                  {t('common.actions.close_text')}
                </button>
              </div>
              <DistrictComments districtId={String(district.id)} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-5 md:p-8 bg-body custom-scrollbar">
              {district.filterData ? (
               <StatsGrid
                  filterData={district.filterData}
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
        {isMapOpen && (
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