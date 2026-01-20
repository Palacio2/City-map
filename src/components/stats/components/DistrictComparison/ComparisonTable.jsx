import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaMapMarkerAlt, FaMinus } from 'react-icons/fa';
import styles from './ComparisonTable.module.css';

export default function ComparisonTable({ districts }) {
  const { t } = useTranslation('comparison');

  if (!districts || districts.length === 0) return null;

  // 👇 ОНОВЛЕНА ЛОГІКА ВАЛЮТ
  const getCurrencyCode = (countryName) => {
    if (!countryName) return 'USD';
    
    const lowerName = countryName.toLowerCase().trim();

    // Україна
    if (['ukraine', 'україна', 'ua', 'ukr'].includes(lowerName)) return 'UAH';
    
    // Польща
    if (['poland', 'polska', 'pl', 'pol', 'польща'].includes(lowerName)) return 'PLN';
    
    // Єврозона (основні країни)
    const euroZone = ['germany', 'france', 'italy', 'spain', 'austria', 'netherlands', 'belgium', 'portugal', 'greece', 'finland', 'ireland', 'slovakia', 'lithuania', 'latvia', 'estonia', 'slovenia', 'cyprus', 'malta', 'luxembourg'];
    if (euroZone.some(c => lowerName.includes(c))) return 'EUR';

    // Велика Британія
    if (['uk', 'united kingdom', 'england', 'london', 'great britain'].includes(lowerName)) return 'GBP';

    // За замовчуванням
    return 'USD';
  };

  // --- Форматувальники ---
  const formatPrice = (val, country) => {
    if (!val || val === 0) return '-';
    
    const currency = getCurrencyCode(country);
    
    try {
      return new Intl.NumberFormat('uk-UA', { 
        style: 'currency', 
        currency, 
        maximumFractionDigits: 0 
      }).format(val);
    } catch (e) {
      // Fallback якщо код валюти некоректний
      return `${val} ${currency}`;
    }
  };

  const formatNumber = (val, unit = '') => {
    if (val === null || val === undefined) return '-';
    return `${val}${unit}`;
  };

  const formatRating = (val) => val ? <span className={styles.rating}>{val}/10</span> : '-';
  
  const formatBool = (val) => {
    if (val === true) return <FaCheck className={styles.check} />;
    if (val === false) return <FaTimes className={styles.cross} />;
    return <FaMinus className={styles.dash} />;
  };

  const formatLevel = (val) => val ? t(`levels.${val}`, { defaultValue: val }) : '-';

  const getValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // --- Конфігурація рядків ---
  const rows = [
    // 1. Фінанси та Населення
    { type: 'header', title: t('finance_population') },
    { label: t('rent_label'), key: 'filterData.general.rentalPrice', format: (v, d) => formatPrice(v, d.country) },
    { label: `${t('sale_label')} (m²)`, key: 'filterData.general.salePriceSqm', format: (v, d) => formatPrice(v, d.country) },
    { label: t('avg_property_price'), key: 'filterData.general.propertyPrice', format: (v, d) => formatPrice(v, d.country) },
    { label: t('avg_salary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
    { label: t('population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
    { label: t('population_density'), key: 'filterData.general.populationDensity', format: (v) => formatNumber(v, ' ос/км²') },
    { label: t('unemployment'), key: 'filterData.general.unemploymentRate', format: (v) => formatNumber(v, '%') },

    // 2. Освіта
    { type: 'header', title: t('education') },
    { label: t('rating'), key: 'filterData.education.rating', format: formatRating },
    { label: t('schools'), key: 'filterData.education.schools' },
    { label: t('kindergartens'), key: 'filterData.education.kindergartens' },
    { label: t('universities'), key: 'filterData.education.universities' },

    // 3. Медицина
    { type: 'header', title: t('medicine') },
    { label: t('rating'), key: 'filterData.medicine.rating', format: formatRating },
    { label: t('hospitals'), key: 'filterData.medicine.hospitals' },
    { label: t('clinics'), key: 'filterData.medicine.clinics' },
    { label: t('pharmacies'), key: 'filterData.medicine.pharmacies' },
    { label: t('emergency'), key: 'filterData.medicine.emergencyServices' },

    // 4. Транспорт
    { type: 'header', title: t('transport') },
    { label: t('rating'), key: 'filterData.transport.rating', format: formatRating },
    { label: t('metro'), key: 'filterData.transport.metroStations' },
    { label: t('bus_stops'), key: 'filterData.transport.busStops' },
    { label: t('tram_stops'), key: 'filterData.transport.tramStops' },
    { label: t('bike_lanes'), key: 'filterData.transport.bikeLanes', format: (v) => formatNumber(v, ' км') },
    { label: t('parking'), key: 'filterData.transport.parkingSpots' },
    { label: t('transport_dist'), key: 'filterData.transport.averageDistance', format: (v) => formatNumber(v, ' м') },
    { label: t('traffic_freq'), key: 'filterData.transport.frequency', format: formatLevel },

    // 5. Безпека
    { type: 'header', title: t('safety') },
    { label: t('rating'), key: 'filterData.safety.rating', format: formatRating },
    { label: t('crime_level'), key: 'filterData.safety.crimeLevel', format: (v) => formatNumber(v, '/100') },
    { label: t('police'), key: 'filterData.safety.policeStations' },
    { label: t('cctv'), key: 'filterData.safety.cctv' },
    { label: t('lighting'), key: 'filterData.safety.streetLighting', format: formatRating },

    // 6. Соціальна сфера
    { type: 'header', title: t('social') },
    { label: t('rating'), key: 'filterData.social.rating', format: formatRating },
    { label: t('parks'), key: 'filterData.social.parks' },
    { label: t('green_zones'), key: 'filterData.general.greenSpaces', format: (v) => formatNumber(v, '%') },
    { label: t('park_size'), key: 'filterData.social.averageParkSize', format: (v) => formatNumber(v, ' м²') },
    { label: t('playgrounds'), key: 'filterData.social.playgrounds' },
    { label: t('sports'), key: 'filterData.social.sportsFacilities' },
    { label: t('culture'), key: 'filterData.social.museums', format: (v, d) => (v || 0) + (getValue(d, 'filterData.social.theaters') || 0) + (getValue(d, 'filterData.social.cinemas') || 0) },
    { label: t('cafes'), key: 'filterData.social.cafesRestaurants' },

    // 7. Комерція
    { type: 'header', title: t('commerce') },
    { label: t('rating'), key: 'filterData.commerce.rating', format: formatRating },
    { label: t('supermarkets'), key: 'filterData.commerce.groceryStores' },
    { label: t('malls'), key: 'filterData.commerce.shoppingMalls' },
    { label: t('banks'), key: 'filterData.commerce.banksATMs' },
    { label: t('beauty'), key: 'filterData.commerce.beautySalons' },
    { label: t('shops_density'), key: 'filterData.commerce.density', format: formatLevel },

    // 8. Комунальні послуги
    { type: 'header', title: t('utilities') },
    { label: t('util_cost'), key: 'filterData.utilities.costPerSqm', format: (v, d) => formatPrice(v, d.country) + '/м²' },
    { label: t('water'), key: 'filterData.utilities.hasWaterSupply', format: formatBool },
    { label: t('heating'), key: 'filterData.utilities.hasHeating', format: formatBool },
    { label: t('gas'), key: 'filterData.utilities.hasGasSupply', format: formatBool },
    { label: t('waste'), key: 'filterData.utilities.hasWasteRemoval', format: formatBool },
  ];

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.metricCol}></th>
            {districts.map((d, i) => (
              <th key={i} className={styles.districtCol}>
                <div className={styles.districtHeader}>
                  <span className={styles.dName}>{d.name}</span>
                  <span className={styles.dCity}><FaMapMarkerAlt /> {d.city}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            if (row.type === 'header') {
              return (
                <tr key={rowIdx} className={styles.sectionHeader}>
                  <td colSpan={districts.length + 1}>{row.title}</td>
                </tr>
              );
            }
            return (
              <tr key={rowIdx} className={styles.dataRow}>
                <td className={styles.metricName}>{row.label}</td>
                {districts.map((d, colIdx) => {
                  const rawVal = getValue(d, row.key);
                  const displayVal = row.format ? row.format(rawVal, d) : (rawVal !== undefined && rawVal !== null ? rawVal : '-');
                  return <td key={colIdx}>{displayVal}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}