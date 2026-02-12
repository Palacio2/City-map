import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './styles/headerFooter.module.css';
import { CloseButton, FavoriteButton } from './Buttons';
import { FiDownload, FiUsers, FiBriefcase, FiTrendingUp, FiHome, FiDollarSign } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useFavorites } from '@pages/favorites/FavoritesContext';

const getStatIcon = (key) => {
  switch (key) {
    case 'population': return <FiUsers />;
    case 'unemploymentRate': return <FiTrendingUp />;
    case 'averageSalary': return <FiBriefcase />;
    case 'propertyPrice': return <FiHome />;
    case 'average_rent_price': return <FiDollarSign />;
    default: return <FiTrendingUp />;
  }
};

export function HeaderSection({
  district,
  updatedAt,
  filterData,
  onClose,
  formatNumber,
  formatPrice,
  isRealtor,
  onDownloadPdf,
  isDownloading,
  isFree,
  currencyInfo
}) {
  const { t, i18n } = useTranslation(['districts', 'common']);
  const { isFavorite, toggleFavorite } = useFavorites();

  const isFav = useMemo(() => {
    return district ? isFavorite(district.id) : false;
  }, [district, isFavorite]);

  const formattedDate = useMemo(() => {
    if (!district) return null;
    const dateToFormat = updatedAt || district.updated_at;
    return dateToFormat
      ? new Date(dateToFormat).toLocaleDateString(i18n.language, {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
      : null;
  }, [updatedAt, district, i18n.language]);

  const quickStatsConfig = useMemo(() => [
    {
      key: 'population',
      label: 'districts:details.population',
      formatter: formatNumber
    },
    {
      key: 'averageSalary',
      label: 'districts:details.salary',
      formatter: (val) => formatPrice ? formatPrice(val, currencyInfo) : val
    },
    {
      key: 'unemploymentRate',
      label: 'districts:details.unemployment',
      formatter: (val) => `${val}%`
    },
    {
      key: 'propertyPrice',
      label: 'districts:details.price',
      formatter: (val) => formatPrice ? formatPrice(val, currencyInfo) : val
    },
    {
      key: 'average_rent_price',
      label: 'districts:pdf.rent',
      formatter: (val) => formatPrice ? formatPrice(val, currencyInfo) : val
    }
  ], [formatNumber, formatPrice, currencyInfo]);

  if (!district) return null;

  const { name, photo_url } = district;
  
  const handleHeartClick = async () => {
    await toggleFavorite(district);
  };

  return (
    <div className={styles.headerSection}>
       {photo_url && (
         <div className={styles.headerBackground}>
            <img src={photo_url} alt={name} className={styles.headerPhoto} />
            <div className={styles.gradientOverlay} />
         </div>
       )}
      
      <div className={styles.headerContent}>
        
        <div className={styles.topBar}>
           <div className={styles.actionButtons}>
             {!isFree && (
               <>
                 <button
                   className={styles.glassBtn}
                   onClick={onDownloadPdf}
                   disabled={isDownloading}
                   title={t('common:actions.download_pdf')}
                 >
                   {isDownloading ? <AiOutlineLoading3Quarters className={styles.spinner} /> : <FiDownload size={20} />}
                 </button>

                 <FavoriteButton
                   isFavorite={isFav}
                   onToggle={handleHeartClick}
                   className={styles.glassBtn}
                 />
               </>
             )}
             <CloseButton onClose={onClose} />
           </div>
        </div>

        <div className={styles.titleSection}>
          <h1 className={styles.districtTitle}>{name}</h1>
        </div>
        
        {isRealtor && filterData?.general && (
          <div className={styles.statsGrid}>
            {quickStatsConfig.map(({ key, label, formatter }) => {
              const value = filterData.general[key];
              if (value === undefined || value === null || (typeof value === 'number' && value <= 0)) return null;

              return (
                <div key={key} className={styles.statCard}>
                  <div className={styles.statIconWrapper}>
                    {getStatIcon(key)}
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>{t(label)}</span>
                    <span className={styles.statValue}>
                        {formatter ? formatter(value) : value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {formattedDate && (
            <div className={styles.updateBadge}>
              <span className={styles.dot}></span>
              {t('districts:details.updated')}: {formattedDate}
            </div>
        )}

      </div>
    </div>
  );
}

export function ModalFooter({ onClose }) {
  const { t } = useTranslation('common');
  return (
    <div className={styles.modalFooter}>
      <button className={styles.closeFooterBtn} onClick={onClose}>
        {t('actions.close')}
      </button>
    </div>
  );
}