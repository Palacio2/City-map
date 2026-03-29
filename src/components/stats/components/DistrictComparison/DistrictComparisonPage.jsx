import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaPlus, FaTimes, FaMapMarkerAlt, FaBalanceScale, FaTrashAlt, FaFilePdf, FaCheckCircle } from 'react-icons/fa';
import { fetchDistrictsByIds } from '@api/districtsApi'; 
import LocationSelectorModal from '../PopularDistricts/LocationSelectorModal';
import ComparisonTable from './ComparisonTable';
import PdfReportTemplate from './PdfReportTemplate';
import ExportSettingsModal from './ExportSettingsModal';
import Loader from '@components/loader/Loader';
import { saveComparison } from '@api/comparisonApi';
import { exportToPDF } from '@utils/pdfExport';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';

const MAX_SELECTION = 4;
const STORAGE_KEY = 'comparison_selected_districts';
const RESULTS_KEY = 'comparison_show_results';

export default function DistrictComparisonPage() {
  const { t } = useTranslation('db');
  
  const [selectedDistricts, setSelectedDistricts] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [showResults, setShowResults] = useState(() => {
    return sessionStorage.getItem(RESULTS_KEY) === 'true';
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedDistricts));
    sessionStorage.setItem(RESULTS_KEY, showResults.toString());
  }, [selectedDistricts, showResults]);

  const handleOpenModal = () => {
    if (selectedDistricts.length >= MAX_SELECTION) {
      alert(t('comparison.limit_reached', { max: MAX_SELECTION }));
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddDistricts = async (districtsArray) => {
    const availableSlots = MAX_SELECTION - selectedDistricts.length;
    const candidates = districtsArray
      .filter(d => !selectedDistricts.some(
        existing => existing.name === d.name && existing.city === d.city && existing.country === d.country
      ))
      .slice(0, availableSlots);

    if (candidates.length === 0) {
      setIsModalOpen(false);
      return;
    }

    setIsSaving(true);
    try {
        const idsToFetch = candidates
            .map(d => d.id)
            .filter(id => id && typeof id === 'string' && id.length > 10);

        let enrichedDistricts = [];
        if (idsToFetch.length > 0) {
            enrichedDistricts = await fetchDistrictsByIds(idsToFetch);
        }

        const finalDistricts = candidates.map(candidate => {
            const fullVer = enrichedDistricts.find(fd => fd.id === candidate.id);
            return {
                ...(fullVer || candidate),
                city: candidate.city,
                country: candidate.country,
                id: candidate.id || `${candidate.city}-${candidate.name}-${Date.now()}` 
            };
        });

        setSelectedDistricts(prev => [...prev, ...finalDistricts]);
        setShowResults(false);
    } catch {
        alert(t('comparison.error_details'));
    } finally {
        setIsSaving(false);
        setIsModalOpen(false);
    }
  };

  const handleRemoveDistrict = (indexToRemove) => {
    setSelectedDistricts(prev => prev.filter((_, index) => index !== indexToRemove));
    setShowResults(false);
  };

  const handleReset = () => {
    if (window.confirm(t('comparison.confirm_clear'))) {
      setSelectedDistricts([]);
      setShowResults(false);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(RESULTS_KEY);
    }
  };

  const handleCompare = async () => {
    if (selectedDistricts.length < 2) return;
    setIsSaving(true);
    try {
      await saveComparison(selectedDistricts);
      setShowResults(true);
      setTimeout(() => {
        document.getElementById('comparison-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setShowResults(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmExport = async (data) => {
    setExportData(data);
    setIsExportModalOpen(false);
    setIsExporting(true);

    setTimeout(async () => {
      try {
        await exportToPDF(
          'pdf-report-template', 
          t('comparison.results_title'), 
          `Report_${new Date().toISOString().slice(0,10)}.pdf`
        );
      } catch {
        alert(t('comparison.error_export'));
      } finally {
        setIsExporting(false);
      }
    }, 500); 
  };

  const displayDistricts = useMemo(() => transformDistrictsForDisplay(selectedDistricts), [selectedDistricts]);

  return (
    <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body animate-fadeIn">
      <div className="max-w-[1200px] mx-auto mb-12 flex flex-col gap-4">
        <Link to="/profile/stats" className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none">
          <FaArrowLeft /> {t('header.back_to_profile', { defaultValue: 'Назад' })}
        </Link>
        <div className="mt-2">
          <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold text-accent mb-2 inline-block bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent">
            {t('comparison.title')}
          </h1>
          <p className="text-textSecondary text-base max-w-[600px] leading-relaxed">
            {t('comparison.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
          <span className="font-heading font-semibold text-textMain bg-surface py-2 px-4 rounded-full border border-borderClient text-[0.9rem] shadow-sm">
            {t('comparison.selected_count')}: {selectedDistricts.length} / {MAX_SELECTION}
          </span>
          {selectedDistricts.length > 0 && (
            <button className="flex items-center gap-2 bg-danger/10 text-danger border border-danger/20 py-2 px-4 rounded-md font-semibold font-heading cursor-pointer transition-all text-[0.85rem] uppercase tracking-widest hover:not(:disabled):bg-danger/20 hover:not(:disabled):-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleReset} disabled={isSaving}>
              <FaTrashAlt /> {t('common.actions.clear', { defaultValue: 'Очистити' })}
            </button>
          )}
        </div>

        {selectedDistricts.length === 0 ? (
          <div className="bg-surface border-2 border-dashed border-borderClient rounded-xl py-[60px] px-5 text-center flex flex-col items-center gap-4 transition-all">
            <div className="text-[3rem] text-textSecondary mb-2 opacity-50"><FaBalanceScale /></div>
            <h3 className="m-0 text-[1.5rem] font-heading font-bold text-textMain">{t('comparison.empty_title')}</h3>
            <p className="m-0 text-textSecondary max-w-[400px]">{t('comparison.empty_desc')}</p>
            <button className="mt-4 py-3.5 px-8 bg-surface border-2 border-accent text-accent font-bold font-heading uppercase tracking-widest rounded-md cursor-pointer transition-all hover:bg-accent hover:text-white hover:-translate-y-0.5 hover:shadow-hover" onClick={handleOpenModal}>
              {t('comparison.start_btn')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {selectedDistricts.map((item, index) => (
              <div key={`${item.city}-${item.name}-${index}`} className="bg-surface rounded-lg p-6 border border-borderClient relative flex flex-col justify-between min-h-[160px] shadow-card transition-all animate-popIn hover:-translate-y-1 hover:shadow-hover hover:border-accent">
                <div className="flex flex-col gap-3">
                  <span className="text-[0.75rem] font-semibold text-textSecondary bg-body py-1.5 px-2.5 rounded-full inline-flex items-center gap-1.5 border border-borderClient w-fit uppercase tracking-[0.03em]">
                    <FaMapMarkerAlt /> {item.city}, {item.country}
                  </span>
                  <h3 className="text-[1.25rem] font-bold font-heading text-textMain m-0 leading-[1.3] pr-6">{item.name}</h3>
                </div>
                <button className="absolute top-4 right-4 bg-transparent border-none text-textSecondary cursor-pointer p-1.5 transition-all text-base rounded-full hover:color-danger hover:bg-danger/10" onClick={() => handleRemoveDistrict(index)} disabled={isSaving}>
                  <FaTimes />
                </button>
              </div>
            ))}
            
            {selectedDistricts.length < MAX_SELECTION && (
              <div className={`border-2 border-dashed border-borderClient rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[160px] text-textSecondary transition-all bg-white/5 hover:border-accent hover:text-accent hover:bg-surface hover:shadow-card ${isSaving ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`} onClick={!isSaving ? handleOpenModal : undefined}>
                {isSaving ? <Loader size="small" /> : (
                  <>
                    <FaPlus className="text-[1.5rem]" />
                    <span className="font-medium">{t('comparison.add_another')}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedDistricts.length >= 2 && !showResults && (
        <div className="max-w-[1200px] mx-auto mt-10 text-center pt-8 border-t border-borderClient flex flex-col items-center animate-fadeIn">
            <div className="flex items-center justify-center gap-2.5 mb-5 text-success font-semibold text-base animate-fadeIn">
                <FaCheckCircle className="text-[1.2rem]" />
                <span>{t('comparison.ready_message')}</span>
            </div>
            <button className="bg-gradient-to-br from-accent to-accent-hover text-white border-none py-4 px-12 text-base font-bold font-heading uppercase tracking-widest rounded-md cursor-pointer shadow-sm transition-all hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-hover hover:not(:disabled):brightness-110 disabled:opacity-70 disabled:cursor-wait" onClick={handleCompare} disabled={isSaving}>
                {isSaving ? <Loader size="small" /> : t('comparison.compare_btn')}
            </button>
        </div>
      )}

      {showResults && (
        <div id="comparison-results" className="max-w-[1200px] mx-auto mt-16 animate-slideDown">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0 sm:text-left text-center">
            <h2 className="text-[1.75rem] font-bold font-heading text-textMain m-0">{t('comparison.results_title')}</h2>
            <button className="flex items-center justify-center gap-2.5 bg-surface text-textMain border border-borderClient py-3 px-6 rounded-md font-semibold font-heading uppercase tracking-widest cursor-pointer transition-all text-[0.85rem] hover:not(:disabled):bg-hover hover:not(:disabled):border-accent hover:not(:disabled):text-accent hover:not(:disabled):-translate-y-0.5 disabled:opacity-60 disabled:cursor-wait w-full sm:w-auto" onClick={() => setIsExportModalOpen(true)} disabled={isExporting}>
              {isExporting ? <Loader size="small" /> : <><FaFilePdf /> {t('comparison.export_pdf')}</>}
            </button>
          </div>
          <ComparisonTable districts={displayDistricts} />
        </div>
      )}

      {/* PDF Export Template Container (Hidden) */}
      <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1 }}>
        <div style={{ width: '794px', background: 'white' }}>
           <PdfReportTemplate districts={displayDistricts} customData={exportData} />
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
        onConfirm={handleConfirmExport}
      />
    </div>
  );
}