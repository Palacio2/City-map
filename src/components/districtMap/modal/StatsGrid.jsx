import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './styles/stats.module.css';
import StatCard from './StatCard';
import { 
  formatNumber, 
  formatPrice, 
  formatBoolean, 
  getFrequencyText,
  getDensityText,
  getCrimeLevelText,
  getCrimeLevelClass 
} from '../../../utils/formatters';

export default function StatsGrid({ filterData, currencyInfo }) {
  const { t } = useTranslation('districts');
  const { code, locale } = currencyInfo || { code: 'UAH', locale: 'uk-UA' };

  if (!filterData) return null;

  const {
    education,
    medicine,
    transport,
    safety,
    social,
    commerce,
    utilities
  } = filterData;

  const hasData = (obj) => {
    if (!obj) return false;
    return Object.values(obj).some(val => val !== null && val !== undefined && val !== '');
  };

  // Хелпер для перекладу значень з ENUM (high, medium, low)
  const tEnum = (key) => key ? t(key) : t('na');

  return (
    <div className={styles.statsGrid}>
      {hasData(education) && (
        <StatCard title={t('stats.categories.education')} icon="🎓" rating={education.rating}>
          {education.kindergartens > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.kindergartens')}</span>
              <strong>{formatNumber(education.kindergartens)}</strong>
            </div>
          )}
          {education.schools > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.schools')}</span>
              <strong>{formatNumber(education.schools)}</strong>
            </div>
          )}
          {education.universities > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.universities')}</span>
              <strong>{formatNumber(education.universities)}</strong>
            </div>
          )}
        </StatCard>
      )}

      {hasData(medicine) && (
        <StatCard title={t('stats.categories.medicine')} icon="🏥" rating={medicine.rating}>
          {medicine.hospitals > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.hospitals')}</span>
              <strong>{formatNumber(medicine.hospitals)}</strong>
            </div>
          )}
          {medicine.clinics > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.clinics')}</span>
              <strong>{formatNumber(medicine.clinics)}</strong>
            </div>
          )}
          {medicine.pharmacies > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.pharmacies')}</span>
              <strong>{formatNumber(medicine.pharmacies)}</strong>
            </div>
          )}
          {medicine.emergencyServices > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.emergency')}</span>
              <strong>{formatNumber(medicine.emergencyServices)}</strong>
            </div>
          )}
        </StatCard>
      )}

      {hasData(transport) && (
        <StatCard title={t('stats.categories.transport')} icon="🚍" rating={transport.rating}>
          {transport.busStops > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.bus_stops')}</span>
              <strong>{formatNumber(transport.busStops)}</strong>
            </div>
          )}
          {transport.tramStops > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.tram_stops')}</span>
              <strong>{formatNumber(transport.tramStops)}</strong>
            </div>
          )}
          {transport.metroStations > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.metro_stations')}</span>
              <strong>{formatNumber(transport.metroStations)}</strong>
            </div>
          )}
          {transport.bikeLanes > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.bike_lanes')}</span>
              <strong>{transport.bikeLanes.toFixed(1)} км</strong>
            </div>
          )}
          {transport.distanceRating > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.transport_dist')}</span>
              <strong>{transport.distanceRating.toFixed(1)}/10</strong>
            </div>
          )}
          {transport.frequency && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.transport_frequency')}</span>
              <strong>{tEnum(getFrequencyText(transport.frequency))}</strong>
            </div>
          )}
        </StatCard>
      )}

      {hasData(safety) && (
        <StatCard title={t('stats.categories.safety')} icon="🛡️" rating={safety.rating}>
          {safety.crimeLevel !== null && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.crime_level')}</span>
              <strong className={getCrimeLevelClass(safety.crimeLevel)}>
                {tEnum(getCrimeLevelText(safety.crimeLevel))}
              </strong>
            </div>
          )}
          {safety.policeStations > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.police_stations')}</span>
              <strong>{formatNumber(safety.policeStations)}</strong>
            </div>
          )}
          {safety.cctv > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.cctv')}</span>
              <strong>{formatNumber(safety.cctv)}</strong>
            </div>
          )}
          {safety.streetLighting > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.lighting')}</span>
              <strong>{safety.streetLighting.toFixed(1)}/10</strong>
            </div>
          )}
        </StatCard>
      )}

      {hasData(social) && (
        <StatCard title={t('stats.categories.social')} icon="🌳" rating={social.rating}>
          {social.parks > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.parks')}</span>
              <strong>{formatNumber(social.parks)}</strong>
            </div>
          )}
          {social.cafesRestaurants > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.cafes')}</span>
              <strong>{formatNumber(social.cafesRestaurants)}</strong>
            </div>
          )}
          {social.playgrounds > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.playgrounds')}</span>
              <strong>{formatNumber(social.playgrounds)}</strong>
            </div>
          )}
          {social.cinemas > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.cinemas')}</span>
              <strong>{formatNumber(social.cinemas)}</strong>
            </div>
          )}
          {social.theaters > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.theaters')}</span>
              <strong>{formatNumber(social.theaters)}</strong>
            </div>
          )}
          {social.museums > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.museums')}</span>
              <strong>{formatNumber(social.museums)}</strong>
            </div>
          )}
        </StatCard>
      )}

      {hasData(commerce) && (
        <StatCard title={t('stats.categories.commerce')} icon="🛒" rating={commerce.rating}>
          {commerce.groceryStores > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.grocery')}</span>
              <strong>{formatNumber(commerce.groceryStores)}</strong>
            </div>
          )}
          {commerce.shoppingMalls > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.malls')}</span>
              <strong>{formatNumber(commerce.shoppingMalls)}</strong>
            </div>
          )}
          {commerce.constructionStores > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.construction')}</span>
              <strong>{formatNumber(commerce.constructionStores)}</strong>
            </div>
          )}
          {commerce.clothingStores > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.clothing')}</span>
              <strong>{formatNumber(commerce.clothingStores)}</strong>
            </div>
          )}
          {commerce.beautySalons > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.beauty')}</span>
              <strong>{formatNumber(commerce.beautySalons)}</strong>
            </div>
          )}
          {commerce.banksATMs > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.banks')}</span>
              <strong>{formatNumber(commerce.banksATMs)}</strong>
            </div>
          )}
        </StatCard>
      )}

      {hasData(utilities) && (
        <StatCard title={t('stats.categories.utilities')} icon="⚡" rating={utilities.qualityRating}>
          <div className={styles.statRow}>
             <span>{t('stats.labels.air_quality')}</span>
             <strong>{utilities.qualityRating ? `${utilities.qualityRating.toFixed(1)}/10` : t('na')}</strong>
          </div>

          {utilities.costPerSqm > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.cost_per_sqm')}</span>
              <strong>{formatPrice(utilities.costPerSqm, code, locale)}</strong>
            </div>
          )}
          {utilities.hasWaterSupply !== null && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.water_supply')}</span>
              <strong>{formatBoolean(utilities.hasWaterSupply)}</strong>
            </div>
          )}
        </StatCard>
      )}
    </div>
  );
}