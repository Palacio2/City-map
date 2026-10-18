import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaFilePdf, FaTimes } from 'react-icons/fa';
import { fetchDistrictsByIds } from '@api/districtsApi'; 
import { registerComparisonEvent } from '../../api/statsApi';
import LocationSelectorModal, { DistrictSelection } from '../PopularDistricts/LocationSelectorModal';
import ComparisonTable from './ComparisonTable';
import PdfReportTemplate from './PdfReportTemplate';
import ExportSettingsModal, { ExportCustomData } from './ExportSettingsModal';
import Loader from '@components/loader/Loader';
import { transformDistrictsForDisplay, TransformedDistrict } from '@utils/dataTransformers';
import { usePdfExport } from '@hooks/usePdfExport';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@/pages/subscription/context/SubscriptionContext';
import { STORAGE_KEYS, BUSINESS_CONSTANTS } from '@config/constants';

const MAX_SELECTION = BUSINESS_CONSTANTS.MAX_COMPARISON_SELECTION;
const STORAGE_KEY = STORAGE_KEYS.COMPARISON_DISTRICTS;

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
    let active = true;
    if (!config || selectedDistricts.length === 0) {
      setDisplayDistricts([]);
      setIsLoadingData(false);
      return;
    }

    const loadDistricts = async () => {
      setIsLoadingData(true);
      try {
        const ids = selectedDistricts.map(d => d.id).filter((id): id is string | number => id !== undefined);
        const rawData = await fetchDistrictsByIds(ids);
        if (!active) return;
        const transformed = transformDistrictsForDisplay(rawData, config, { isFree, isRealtor });
        const sorted = selectedDistricts.map(sd => transformed.find(td => td.id === sd.id)).filter(Boolean) as TransformedDistrict[];
        setDisplayDistricts(sorted);

        if (sorted.length > 1) {
          registerComparisonEvent(sorted).catch(console.error);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setIsLoadingData(false);
      }
    };

    loadDistricts();
    return () => { active = false; };
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

  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 py-6 md:py-8 box-border min-h-[calc(100vh-var(--header-height))] animate-fadeIn">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-textSecondary hover:text-accent transition-colors font-semibold text-[0.95rem] bg-transparent border-none cursor-pointer p-0 m-0"
        >
          <FaArrowLeft /> {t('stats.actions.back')}
        </button>
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
        <div className="flex flex-col items-center justify-center p-16 bg-surface dark:bg-white/5 rounded-xl border border-borderClient dark:border-white/10 border-dashed text-textSecondary text-center">
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
