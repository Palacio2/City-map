import React from 'react';
import StatCard from './StatCard';
import styles from '../DistrictDetailsModal.module.css';

const ModalStatsGrid = ({ filterData, getRatingColor, formatNumber, getCrimeLevelText, getCrimeLevelClass }) => {
  if (!filterData) {
    return (
      <div className={styles.noData}>
        <div className={styles.noDataIcon}>📊</div>
        <h3>Дані відсутні</h3>
        <p>Інформація про цей район ще не додана до системи</p>
      </div>
    );
  }

  const statSections = [
    {
      icon: '🎓',
      title: 'Освіта',
      rating: filterData.education?.rating,
      stats: [
        { label: 'Дитячі садки', value: formatNumber(filterData.education?.kindergartens) },
        { label: 'Школи', value: formatNumber(filterData.education?.schools) },
        { label: 'Університети', value: formatNumber(filterData.education?.universities) },
      ],
    },
    {
      icon: '🏥',
      title: 'Медицина',
      rating: filterData.medicine?.rating,
      stats: [
        { label: 'Лікарні', value: formatNumber(filterData.medicine?.hospitals) },
        { label: 'Клініки', value: formatNumber(filterData.medicine?.clinics) },
        { label: 'Аптеки', value: formatNumber(filterData.medicine?.pharmacies) },
      ],
    },
    {
      icon: '🚍',
      title: 'Транспорт',
      rating: filterData.transport?.rating,
      stats: [
        { label: 'Автобусні зупинки', value: formatNumber(filterData.transport?.busStops) },
        { label: 'Станції метро', value: formatNumber(filterData.transport?.metroStations) },
      ],
    },
    {
      icon: '🛡️',
      title: 'Безпека',
      rating: filterData.safety?.rating,
      stats: [
        {
          label: 'Рівень злочинності',
          value: (
            <strong className={getCrimeLevelClass(filterData.safety?.crimeLevel)}>
              {getCrimeLevelText(filterData.safety?.crimeLevel)}
            </strong>
          ),
        },
        { label: 'Відділки поліції', value: formatNumber(filterData.safety?.policeStations) },
      ],
    },
    {
      icon: '🌳',
      title: 'Соціальна',
      rating: filterData.social?.rating,
      stats: [
        { label: 'Парки', value: formatNumber(filterData.social?.parks) },
        { label: 'Дитячі майданчики', value: formatNumber(filterData.social?.playgrounds) },
        { label: 'Кафе та ресторани', value: formatNumber(filterData.social?.cafesRestaurants) },
      ],
    },
    {
      icon: '🛒',
      title: 'Комерція',
      rating: filterData.commerce?.rating,
      stats: [
        { label: 'Продуктові магазини', value: formatNumber(filterData.commerce?.groceryStores) },
        { label: 'Банки та банкомати', value: formatNumber(filterData.commerce?.banksATMs) },
      ],
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {statSections.map((section, index) => (
        <StatCard
          key={index}
          icon={section.icon}
          title={section.title}
          rating={section.rating}
          stats={section.stats}
          getRatingColor={getRatingColor}
        />
      ))}
    </div>
  );
};

export default ModalStatsGrid;
