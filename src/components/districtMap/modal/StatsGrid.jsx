import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './styles/stats.module.css';
import StatCard from './StatCard';
import { 
  formatNumber, 
  formatPrice, 
  formatBoolean, 
  getFrequencyText,
  getCrimeLevelText,
  getCrimeLevelClass 
} from '@utils/formatters';

const StatRow = ({ label, value, formatter, rawValue, suffix = '', className = '' }) => {
  const { t } = useTranslation('districts');
  
  const valToCheck = rawValue !== undefined ? rawValue : value;
  const isValid = valToCheck !== null && valToCheck !== undefined && valToCheck !== false && valToCheck !== '';
  const isPositiveNumber = typeof valToCheck === 'number' ? valToCheck > 0 : true;

  if (!isValid || !isPositiveNumber) return null;

  const displayValue = formatter ? formatter(value) : value;

  return (
    <div className={styles.statRow}>
      <span>{t(label)}</span>
      <strong className={className}>
        {displayValue}{suffix}
      </strong>
    </div>
  );
};

export default function StatsGrid({ filterData, currencyInfo }) {
  const { t } = useTranslation('districts');
  const { code, locale } = currencyInfo || { code: 'UAH', locale: 'uk-UA' };

  if (!filterData) return null;

  const {
    education, medicine, transport, safety, social, commerce, utilities
  } = filterData;

  const hasData = (obj) => {
    if (!obj) return false;
    return Object.values(obj).some(val => val !== null && val !== undefined && val !== '' && val !== 0 && val !== false);
  };

  return (
    <div className={styles.statsGrid}>
      {/* --- EDUCATION --- */}
      {hasData(education) && (
        <StatCard title={t('stats.categories.education')} icon="🎓" rating={education.rating}>
          <StatRow label="stats.labels.kindergartens" value={education.kindergartens} formatter={formatNumber} />
          <StatRow label="stats.labels.schools" value={education.schools} formatter={formatNumber} />
          <StatRow label="stats.labels.universities" value={education.universities} formatter={formatNumber} />
        </StatCard>
      )}

      {/* --- MEDICINE --- */}
      {hasData(medicine) && (
        <StatCard title={t('stats.categories.medicine')} icon="🏥" rating={medicine.rating}>
          <StatRow label="stats.labels.hospitals" value={medicine.hospitals} formatter={formatNumber} />
          <StatRow label="stats.labels.clinics" value={medicine.clinics} formatter={formatNumber} />
          <StatRow label="stats.labels.pharmacies" value={medicine.pharmacies} formatter={formatNumber} />
          <StatRow label="stats.labels.emergency" value={medicine.emergencyServices} formatter={formatNumber} />
        </StatCard>
      )}

      {/* --- TRANSPORT --- */}
      {hasData(transport) && (
        <StatCard title={t('stats.categories.transport')} icon="🚍" rating={transport.rating}>
          <StatRow label="stats.labels.metro_stations" value={transport.metroStations} formatter={formatNumber} />
          <StatRow label="stats.labels.bus_stops" value={transport.busStops} formatter={formatNumber} />
          <StatRow label="stats.labels.tram_stops" value={transport.tramStops} formatter={formatNumber} />
          <StatRow 
            label="stats.labels.bike_lanes" 
            value={transport.bikeLanes} 
            formatter={(v) => v.toFixed(1)} 
            suffix=" км" 
          />
          <StatRow label="stats.labels.parking" value={transport.parkingSpots} formatter={formatNumber} />
          <StatRow 
            label="stats.labels.transport_frequency" 
            value={transport.frequency} 
            formatter={(v) => v ? t(getFrequencyText(v)) : t('na')} 
            rawValue={transport.frequency}
          />
        </StatCard>
      )}

      {/* --- SAFETY --- */}
      {hasData(safety) && (
        <StatCard title={t('stats.categories.safety')} icon="🛡️" rating={safety.rating}>
          {safety.crimeLevel !== null && (
            <StatRow 
              label="stats.labels.crime_level"
              value={t(getCrimeLevelText(safety.crimeLevel))}
              className={getCrimeLevelClass(safety.crimeLevel, styles)}
              rawValue={true} 
            />
          )}
          <StatRow label="stats.labels.police_stations" value={safety.policeStations} formatter={formatNumber} />
          <StatRow label="stats.labels.cctv" value={safety.cctv} formatter={formatNumber} />
          <StatRow 
            label="stats.labels.lighting" 
            value={safety.streetLighting} 
            suffix="/10" 
          />
        </StatCard>
      )}

      {/* --- SOCIAL --- */}
      {hasData(social) && (
        <StatCard title={t('stats.categories.social')} icon="🌳" rating={social.rating}>
          <StatRow label="stats.labels.parks" value={social.parks} formatter={formatNumber} />
          <StatRow label="stats.labels.cafes" value={social.cafesRestaurants} formatter={formatNumber} />
          <StatRow label="stats.labels.playgrounds" value={social.playgrounds} formatter={formatNumber} />
          <StatRow label="stats.labels.theaters" value={social.theaters} formatter={formatNumber} />
          <StatRow label="stats.labels.cinemas" value={social.cinemas} formatter={formatNumber} />
          <StatRow label="stats.labels.museums" value={social.museums} formatter={formatNumber} />
          <StatRow label="stats.labels.libraries" value={social.libraries} formatter={formatNumber} />
        </StatCard>
      )}

      {/* --- COMMERCE --- */}
      {hasData(commerce) && (
        <StatCard title={t('stats.categories.commerce')} icon="🛒" rating={commerce.rating}>
          <StatRow label="stats.labels.grocery" value={commerce.groceryStores} formatter={formatNumber} />
          <StatRow label="stats.labels.malls" value={commerce.shoppingMalls} formatter={formatNumber} />
          <StatRow label="stats.labels.banks" value={commerce.banksATMs} formatter={formatNumber} />
          <StatRow label="stats.labels.post_offices" value={commerce.postOffices} formatter={formatNumber} />
          <StatRow label="stats.labels.construction" value={commerce.constructionStores} formatter={formatNumber} />
          <StatRow label="stats.labels.clothing" value={commerce.clothingStores} formatter={formatNumber} />
          <StatRow label="stats.labels.beauty" value={commerce.beautySalons} formatter={formatNumber} />
        </StatCard>
      )}

      {/* --- UTILITIES --- */}
      {hasData(utilities) && (
        <StatCard title={t('stats.categories.utilities')} icon="⚡" rating={utilities.qualityRating}>
          <StatRow 
            label="stats.labels.cost_per_sqm" 
            value={utilities.costPerSqm} 
            formatter={(v) => formatPrice(v, code, locale)} 
          />
          <StatRow label="stats.labels.water_supply" value={utilities.hasWaterSupply} formatter={formatBoolean} rawValue={utilities.hasWaterSupply} />
          <StatRow label="stats.labels.electricity" value={utilities.hasElectricity} formatter={formatBoolean} rawValue={utilities.hasElectricity} />
          <StatRow label="stats.labels.heating" value={utilities.hasHeating} formatter={formatBoolean} rawValue={utilities.hasHeating} />
          <StatRow label="stats.labels.gas_supply" value={utilities.hasGasSupply} formatter={formatBoolean} rawValue={utilities.hasGasSupply} />
          <StatRow label="stats.labels.waste_removal" value={utilities.hasWasteRemoval} formatter={formatBoolean} rawValue={utilities.hasWasteRemoval} />
        </StatCard>
      )}
    </div>
  );
}