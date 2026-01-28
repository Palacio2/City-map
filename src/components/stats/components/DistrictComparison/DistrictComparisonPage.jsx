import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaPlus, FaTimes, FaMapMarkerAlt, FaBalanceScale, FaTrashAlt, FaFilePdf } from 'react-icons/fa';
import LocationSelectorModal from '../PopularDistricts/LocationSelectorModal';
import ComparisonTable from './ComparisonTable';
import PdfReportTemplate from './PdfReportTemplate';
import ExportSettingsModal from './ExportSettingsModal';
import { saveComparison } from '@api/comparisonApi';
import { exportToPDF } from '@utils/pdfExport';
// 👇 ВАЖЛИВО: Імпорт трансформера
import { transformDistrictsForDisplay } from '@utils/dataTransformers';
import styles from './DistrictComparisonPage.module.css';

const MAX_SELECTION = 4;
const STORAGE_KEY = 'comparison_selected_districts';

export default function DistrictComparisonPage() {
  const { t } = useTranslation(['comparison', 'stats']);
  
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
  
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedDistricts));
  }, [selectedDistricts]);

  const handleOpenModal = () => {
    if (selectedDistricts.length >= MAX_SELECTION) {
      alert(t('limit_reached', { max: MAX_SELECTION }));
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddDistricts = (country, city, districtsArray) => {
    const availableSlots = MAX_SELECTION - selectedDistricts.length;
    
    const newDistricts = districtsArray
      .filter(d => !selectedDistricts.some(
        existing => existing.name === (d.name || d) && existing.city === city && existing.country === country
      ))
      .slice(0, availableSlots)
      .map(d => ({
        ...d,
        id: d.id || `${city}-${d.name}-${Date.now()}`,
        name: d.name || d,
        city,
        country
      }));

    if (newDistricts.length > 0) {
      setSelectedDistricts(prev => [...prev, ...newDistricts]);
      setShowResults(false);
    }
    
    setIsModalOpen(false);
  };

  const handleRemoveDistrict = (indexToRemove) => {
    setSelectedDistricts(prev => prev.filter((_, index) => index !== indexToRemove));
    setShowResults(false);
  };

  const handleReset = () => {
    if (window.confirm(t('stats:actions.confirm_reset'))) {
      setSelectedDistricts([]);
      setShowResults(false);
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

    } catch (error) {
      console.error(error);
      setShowResults(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async (data) => {
    setExportData(data);
    setIsExportModalOpen(false);
    setIsExporting(true);

    setTimeout(async () => {
      try {
        await exportToPDF(
          'pdf-report-template', 
          t('results_title'), 
          `GeoAnalyzer_Report_${new Date().toISOString().slice(0,10)}.pdf`
        );
      } catch (error) {
        console.error("PDF Export failed:", error);
        alert(t('stats:error_export'));
      } finally {
        setIsExporting(false);
      }
    }, 800); 
  };

  // 👇 Трансформація даних перед рендером
  const displayDistricts = showResults ? transformDistrictsForDisplay(selectedDistricts) : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile/stats" className={styles.backButton}>
          <FaArrowLeft /> {t('stats:stats_page.back_to_profile')}
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>
      </div>

      <div className={styles.selectionArea}>
        <div className={styles.controls}>
          <span className={styles.counter}>
            {t('selected_count')}: {selectedDistricts.length} / {MAX_SELECTION}
          </span>
          
          {selectedDistricts.length > 0 && (
            <button className={styles.resetBtn} onClick={handleReset} disabled={isSaving}>
              <FaTrashAlt /> {t('stats:actions.clear_all')}
            </button>
          )}
        </div>

        {selectedDistricts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaBalanceScale /></div>
            <h3>{t('empty_title')}</h3>
            <p>{t('empty_desc')}</p>
            <button className={styles.startBtn} onClick={handleOpenModal}>
              {t('start_btn')}
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {selectedDistricts.map((item, index) => (
              <div key={`${item.city}-${item.name}-${index}`} className={styles.card}>
                <div className={styles.cardContent}>
                  <span className={styles.locationBadge}>
                    <FaMapMarkerAlt /> {item.city}, {item.country}
                  </span>
                  <h3 className={styles.districtName}>{item.name}</h3>
                </div>
                <button 
                  className={styles.removeBtn} 
                  onClick={() => handleRemoveDistrict(index)}
                  title={t('stats:actions.delete')}
                  disabled={isSaving}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            
            {selectedDistricts.length < MAX_SELECTION && (
              <div 
                className={`${styles.addCard} ${isSaving ? styles.disabled : ''}`} 
                onClick={!isSaving ? handleOpenModal : undefined}
              >
                <FaPlus className={styles.addIcon} />
                <span>{t('add_another')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedDistricts.length >= 2 && !showResults && (
        <div className={styles.compareAction}>
          <button 
            className={styles.compareBtn} 
            onClick={handleCompare}
            disabled={isSaving}
          >
            {isSaving ? t('stats:loading') : t('compare_btn')}
          </button>
        </div>
      )}

      {showResults && (
        <div id="comparison-results" className={styles.resultsArea}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>{t('results_title')}</h2>
            
            <button 
              className={styles.exportBtn} 
              onClick={handleExportClick} 
              disabled={isExporting}
            >
              <FaFilePdf />
              {isExporting ? t('stats:loading') : t('export_pdf')}
            </button>
          </div>
          
          <ComparisonTable districts={displayDistricts} />
        </div>
      )}

      <div style={{ position: 'fixed', top: 0, left: '-10000px', zIndex: -1 }}>
        <PdfReportTemplate 
            districts={displayDistricts} 
            customData={exportData} 
        />
      </div>

      {isModalOpen && (
        <LocationSelectorModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddDistricts}
          includeDistrict={true}
          trackedLocations={[]} 
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