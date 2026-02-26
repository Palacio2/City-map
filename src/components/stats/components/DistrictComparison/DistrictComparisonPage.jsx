import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaPlus, FaTimes, FaMapMarkerAlt, FaBalanceScale, FaTrashAlt, FaFilePdf } from 'react-icons/fa';
import { fetchDistrictsByIds } from '@api/districtsApi'; 
import LocationSelectorModal from '../PopularDistricts/LocationSelectorModal';
import ComparisonTable from './ComparisonTable';
import PdfReportTemplate from './PdfReportTemplate';
import ExportSettingsModal from './ExportSettingsModal';
import { saveComparison } from '@api/comparisonApi';
import { exportToPDF } from '@utils/pdfExport';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';
import styles from './DistrictComparisonPage.module.css';

const MAX_SELECTION = 4;
const STORAGE_KEY = 'comparison_selected_districts';

export default function DistrictComparisonPage() {
  // Використовуємо comparison як основний, common як допоміжний
  const { t } = useTranslation(['comparison', 'common']);
  
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
            try {
                enrichedDistricts = await fetchDistrictsByIds(idsToFetch);
            } catch (error) {
                console.error("API Error fetching details:", error);
            }
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

    } catch (err) {
        console.error("Failed to add districts:", err);
        alert(t('error_details'));
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
    if (window.confirm(t('confirm_clear'))) {
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
        alert(t('error_export'));
      } finally {
        setIsExporting(false);
      }
    }, 1000); 
  };

  const displayDistricts = useMemo(() => {
    return transformDistrictsForDisplay(selectedDistricts);
  }, [selectedDistricts]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile/stats" className={styles.backButton}>
          <FaArrowLeft /> {t('common:actions.back_to_profile')}
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
              <FaTrashAlt /> {t('common:actions.clear')}
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
                  title={t('common:actions.delete')}
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
            {isSaving ? t('common:general.loading') : t('compare_btn')}
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
              {isExporting ? t('common:general.loading') : t('export_pdf')}
            </button>
          </div>
          
          <ComparisonTable districts={displayDistricts} />
        </div>
      )}

      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: '-10000px', 
        zIndex: -1,
        width: '794px',  
        minHeight: '1123px'
      }}>
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