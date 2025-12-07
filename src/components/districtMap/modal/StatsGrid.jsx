import React from 'react';
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

  return (
    <div className={styles.statsGrid}>
      {/* Освіта */}
      <StatCard title="Освіта" icon="🎓" rating={education?.rating}>
        <div className={styles.statRow}>
          <span>Дитячі садки:</span>
          <strong>{formatNumber(education?.kindergartens)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Школи:</span>
          <strong>{formatNumber(education?.schools)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Університети:</span>
          <strong>{formatNumber(education?.universities)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Загальний рейтинг:</span>
          <strong>{education?.rating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
      </StatCard>

      {/* Медицина */}
      <StatCard title="Медицина" icon="🏥" rating={medicine?.rating}>
        <div className={styles.statRow}>
          <span>Лікарні:</span>
          <strong>{formatNumber(medicine?.hospitals)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Клініки:</span>
          <strong>{formatNumber(medicine?.clinics)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Аптеки:</span>
          <strong>{formatNumber(medicine?.pharmacies)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Служби екстреної допомоги:</span>
          <strong>{formatNumber(medicine?.emergencyServices)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Загальний рейтинг:</span>
          <strong>{medicine?.rating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
      </StatCard>

      {/* Транспорт */}
      <StatCard title="Транспорт" icon="🚍" rating={transport?.rating}>
        <div className={styles.statRow}>
          <span>Автобусні зупинки:</span>
          <strong>{formatNumber(transport?.busStops)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Трамвайні зупинки:</span>
          <strong>{formatNumber(transport?.tramStops)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Станції метро:</span>
          <strong>{formatNumber(transport?.metroStations)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Велодоріжки (км):</span>
          <strong>{transport?.bikeLanes?.toFixed(1) || 'н/д'}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Паркувальні місця:</span>
          <strong>{formatNumber(transport?.parkingSpots)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Середня відстань до зупинки (м):</span>
          <strong>{formatNumber(transport?.averageDistance)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Частота транспорту:</span>
          <strong>{getFrequencyText(transport?.frequency)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Загальний рейтинг:</span>
          <strong>{transport?.rating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
      </StatCard>

      {/* Безпека */}
      <StatCard title="Безпека" icon="🛡️" rating={safety?.rating}>
        <div className={styles.statRow}>
          <span>Рівень злочинності:</span>
          <strong className={`${getCrimeLevelClass(safety?.crimeLevel)}`}>
            {getCrimeLevelText(safety?.crimeLevel)}
          </strong>
        </div>
        <div className={styles.statRow}>
          <span>Відділки поліції:</span>
          <strong>{formatNumber(safety?.policeStations)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Камери відеоспостереження:</span>
          <strong>{formatNumber(safety?.cctv)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Рейтинг вуличного освітлення:</span>
          <strong>{safety?.streetLighting?.toFixed(1) || 'н/д'}/10</strong>
        </div>
        <div className={styles.statRow}>
          <span>Загальний рейтинг:</span>
          <strong>{safety?.rating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
      </StatCard>

      {/* Соціальна інфраструктура */}
      <StatCard title="Соціальна" icon="🌳" rating={social?.rating}>
        <div className={styles.statRow}>
          <span>Парки:</span>
          <strong>{formatNumber(social?.parks)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Середній розмір парку (м²):</span>
          <strong>{formatNumber(social?.averageParkSize)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Дитячі майданчики:</span>
          <strong>{formatNumber(social?.playgrounds)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Спортивні споруди:</span>
          <strong>{formatNumber(social?.sportsFacilities)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Кафе та ресторани:</span>
          <strong>{formatNumber(social?.cafesRestaurants)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Бібліотеки:</span>
          <strong>{formatNumber(social?.libraries)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Кінотеатри:</span>
          <strong>{formatNumber(social?.cinemas)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Театри:</span>
          <strong>{formatNumber(social?.theaters)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Музеї:</span>
          <strong>{formatNumber(social?.museums)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Загальний рейтинг:</span>
          <strong>{social?.rating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
      </StatCard>

      {/* Комерція */}
      <StatCard title="Комерція" icon="🛒" rating={commerce?.rating}>
        <div className={styles.statRow}>
          <span>Продуктові магазини:</span>
          <strong>{formatNumber(commerce?.groceryStores)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Будівельні магазини:</span>
          <strong>{formatNumber(commerce?.constructionStores)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Одяг та взуття:</span>
          <strong>{formatNumber(commerce?.clothingStores)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Торгові центри:</span>
          <strong>{formatNumber(commerce?.shoppingMalls)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Банки та банкомати:</span>
          <strong>{formatNumber(commerce?.banksATMs)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Поштові відділення:</span>
          <strong>{formatNumber(commerce?.postOffices)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Салони краси:</span>
          <strong>{formatNumber(commerce?.beautySalons)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Щільність магазинів:</span>
          <strong>{getDensityText(commerce?.density)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Загальний рейтинг:</span>
          <strong>{commerce?.rating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
      </StatCard>

      {/* Комунальні послуги */}
      <StatCard title="Комунальні послуги" icon="⚡" rating={utilities?.qualityRating}>
        <div className={styles.statRow}>
          <span>Якість послуг:</span>
          <strong>{utilities?.qualityRating?.toFixed(1) || 'н/д'}/10</strong>
        </div>
        <div className={styles.statRow}>
          <span>Вартість за м²:</span>
          <strong>{formatPrice(utilities?.costPerSqm)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Водопостачання:</span>
          <strong>{formatBoolean(utilities?.hasWaterSupply)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Опалення:</span>
          <strong>{formatBoolean(utilities?.hasHeating)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Електрика:</span>
          <strong>{formatBoolean(utilities?.hasElectricity)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Газопостачання:</span>
          <strong>{formatBoolean(utilities?.hasGasSupply)}</strong>
        </div>
        <div className={styles.statRow}>
          <span>Вивіз сміття:</span>
          <strong>{formatBoolean(utilities?.hasWasteRemoval)}</strong>
        </div>
      </StatCard>
    </div>
  );
}