import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaFilePdf, FaTimes } from 'react-icons/fa';
import { fetchDistrictsByIds } from '@api/districtsApi'; 
import LocationSelectorModal, { DistrictSelection } from '../PopularDistricts/LocationSelectorModal';
import ComparisonTable from './ComparisonTable';
import PdfReportTemplate from './PdfReportTemplate';
import ExportSettingsModal, { ExportCustomData } from './ExportSettingsModal';
import Loader from '@components/loader/Loader';
import { transformDistrictsForDisplay, TransformedDistrict } from '@utils/dataTransformers';
import { usePdfExport } from '@hooks/usePdfExport';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@subscription/SubscriptionContext';

const MAX_SELECTION = 4;
const STORAGE_KEY = 'comparison_selected_districts';

export default function DistrictComparisonPage() {
  const { t } = useTranslation('db');
  const { isDownloading, downloadPdf } = usePdfExport('comparison_report');
  
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();

  const [selectedDistricts, setSelectedDistricts] = useState<DistrictSelection[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [displayDistricts, setDisplayDistricts] = useState<TransformedDistrict[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState<ExportCustomData | null>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedDistricts));
  }, [selectedDistricts]);

  useEffect(() => {
    if (!config || selectedDistricts.length === 0) {
      setDisplayDistricts([]);
      return;
    }

    const loadDistricts = async () => {
      setIsLoadingData(true);
      try {
        const ids = selectedDistricts.map(d => d.id);
        const rawData = await fetchDistrictsByIds(ids);
        const transformed = transformDistrictsForDisplay(rawData, config, { isFree, isRealtor });
        const sorted = selectedDistricts.map(sd => transformed.find(td => td.id === sd.id)).filter(Boolean) as TransformedDistrict[];
        setDisplayDistricts(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDistricts();
  }, [selectedDistricts, config, isFree, isRealtor]);

  const handleAddDistricts = (selections: DistrictSelection[]) => {
    setSelectedDistricts(selections);
    setIsModalOpen(false);
  };

  const handleExportConfirm = (data: ExportCustomData) => {
    setExportData(data);
    setIsExportModalOpen(false);
    setTimeout(() => {
      downloadPdf('pdf-export-container');
    }, 500);
  };

  const handleClearSelection = () => {
    setSelectedDistricts([]);
  };

  return (
    <div className="flex flex-col w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 py-6 md:py-8 box-border min-h-[calc(100vh-var(--header-height))] animate-fadeIn">
      <div className="mb-6 flex items-center justify-between">
         <Link to="/profile/stats/" className="flex items-center gap-2 text-textSecondary hover:text-accent transition-colors font-semibold text-[0.95rem] no-underline">
            <FaArrowLeft /> {t('stats.actions.back')}
         </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="m-0 font-heading text-2xl md:text-3xl font-bold text-textMain">{t('stats.comparison.title')}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="m-0 text-[0.95rem] text-textSecondary">
              {t('stats.comparison.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {selectedDistricts.length > 0 && (
            <button 
              className="bg-transparent border-none text-danger text-[0.9rem] font-semibold cursor-pointer transition-colors hover:text-danger/70 flex items-center gap-1.5 p-0" 
              onClick={handleClearSelection}
            >
              <FaTimes /> {t('stats.actions.clear_selection')}
            </button>
          )}
          <button className="ui-button-outline !py-2.5 flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            {t('stats.comparison.change_districts')}
          </button>
          <button 
            className="ui-button-primary !py-2.5 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
            onClick={() => setIsExportModalOpen(true)} 
            disabled={isDownloading || isLoadingData || displayDistricts.length === 0}
          >
            {isDownloading ? <Loader size="small" /> : <><FaFilePdf /> {t('stats.comparison.export_pdf')}</>}
          </button>
        </div>
      </div>
      
      {selectedDistricts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-surface rounded-xl border border-borderClient border-dashed text-textSecondary text-center">
          <div className="text-5xl mb-4 opacity-50 grayscale">⚖️</div>
          <h3 className="m-0 font-heading text-xl font-bold text-textMain">{t('stats.comparison.empty_title')}</h3>
          <p className="mt-2 mb-6 text-[0.95rem] max-w-[400px]">{t('stats.comparison.empty_text')}</p>
          <button className="ui-button-primary" onClick={() => setIsModalOpen(true)}>
            {t('stats.comparison.add_first')}
          </button>
        </div>
      ) : isLoadingData || !config ? (
         <div className="flex justify-center p-20"><Loader size="large" /></div>
      ) : (
         <ComparisonTable districts={displayDistricts} config={config} />
      )}

      <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1 }}>
        <div id="pdf-export-container" style={{ width: '794px', background: 'white' }}>
           <PdfReportTemplate districts={displayDistricts} customData={exportData} config={config} />
        </div>
      </div>

      {isModalOpen && (
        <LocationSelectorModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddDistricts}
          includeDistrict={true}
          maxSelection={MAX_SELECTION}
          currentCount={selectedDistricts.length}
        />
      )}

      <ExportSettingsModal 
         isOpen={isExportModalOpen}
         onClose={() => setIsExportModalOpen(false)}
         onConfirm={handleExportConfirm}
      />
    </div>
  );
}