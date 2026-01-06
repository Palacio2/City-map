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

export default function StatsGrid({ filterData }) {
  const { t } = useTranslation('districts');

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

  return (
    <div className={styles.statsGrid}>
      {/* Освіта */}
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

      {/* Медицина */}
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
        </StatCard>
      )}

      {/* Транспорт */}
      {hasData(transport) && (
        <StatCard title={t('stats.categories.transport')} icon="🚍" rating={transport.rating}>
          {transport.busStops > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.bus_stops')}</span>
              <strong>{formatNumber(transport.busStops)}</strong>
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
              <strong>{transport.bikeLanes.toFixed(1)}</strong>
            </div>
          )}
          {transport.frequency && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.transport_frequency')}</span>
              {/* Примітка: getFrequencyText може повертати текст, який теж потребує перекладу */}
              <strong>{getFrequencyText(transport.frequency)}</strong>
            </div>
          )}
        </StatCard>
      )}

      {/* Безпека */}
      {hasData(safety) && (
        <StatCard title={t('stats.categories.safety')} icon="🛡️" rating={safety.rating}>
          {safety.crimeLevel !== null && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.crime_level')}</span>
              <strong className={getCrimeLevelClass(safety.crimeLevel)}>
                {getCrimeLevelText(safety.crimeLevel)}
              </strong>
            </div>
          )}
          {safety.policeStations > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.police_stations')}</span>
              <strong>{formatNumber(safety.policeStations)}</strong>
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

      {/* Соціальна інфраструктура */}
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
        </StatCard>
      )}

      {/* Комерція */}
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
          {commerce.banksATMs > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.banks')}</span>
              <strong>{formatNumber(commerce.banksATMs)}</strong>
            </div>
          )}
        </StatCard>
      )}

      {/* Комунальні послуги */}
      {hasData(utilities) && (
        <StatCard title={t('stats.categories.utilities')} icon="⚡" rating={utilities.qualityRating}>
          {utilities.costPerSqm > 0 && (
            <div className={styles.statRow}>
              <span>{t('stats.labels.cost_per_sqm')}</span>
              <strong>{formatPrice(utilities.costPerSqm)}</strong>
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