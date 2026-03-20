import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../services/api';
import EntityModal from './EntityModal';
import ConfirmModal from './ConfirmModal';
import CityMapModal from './CityMapModal';
import { FaEyeSlash, FaPlus, FaTrash, FaMapMarkedAlt, FaSearch } from 'react-icons/fa';
import styles from './ManualSidebar.module.css';
import uiStyles from '../../ui/AdminUI.module.css'; 
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/AdminContext';

const getFreshnessColor = (lastUpdated) => {
    if (!lastUpdated) return '#ef4444'; 
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMonths = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (diffMonths < 3) return '#10b981'; 
    if (diffMonths < 6) return '#f59e0b'; 
    return '#ef4444'; 
};

const SidebarList = ({ 
    title, parentName, onAdd, searchVal, onSearch, searchPlaceholder, 
    items, selectedItem, onSelect, onMapClick, onDelete, showEyeIcon, showFreshness 
}) => (
    <div className={styles.listBlock}>
        <div className={styles.listHeader}>
            <div className={styles.listTitle}>
                {title} {parentName && <span className={styles.parentName}>({parentName})</span>}
            </div>
            {onAdd && (
                <button onClick={onAdd} className={styles.addGhostBtn}>
                    <FaPlus /> <span>Додати</span>
                </button>
            )}
        </div>
        
        <div className={styles.searchWrapper}>
            <FaSearch className={styles.searchIcon} />
            <input 
                type="text" 
                placeholder={searchPlaceholder} 
                className={`${uiStyles.input} ${styles.searchInput}`} 
                value={searchVal} 
                onChange={e => onSearch(e.target.value)} 
            />
        </div>
        
        <div className={styles.list}>
            {items.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => onSelect(item)} 
                    className={`${styles.listItem} ${selectedItem?.id === item.id ? styles.listItemSelected : ''}`}
                >
                    <span className={styles.itemText} style={{ color: item.is_available === false ? 'var(--text-muted)' : 'inherit' }}>
                        {showFreshness && (
                            <div 
                                className={styles.freshnessIndicator}
                                style={{ 
                                    backgroundColor: getFreshnessColor(item.last_updated),
                                    boxShadow: `0 0 6px ${getFreshnessColor(item.last_updated)}80`
                                }} 
                                title={item.last_updated ? `Останнє оновлення: ${new Date(item.last_updated).toLocaleDateString()}` : 'Ніколи не оновлювалось'}
                            />
                        )}
                        {item.name} 
                        {showEyeIcon && !item.is_available && <FaEyeSlash className={styles.eyeIcon} />}
                    </span>
                    <div className={styles.actionGroup}>
                        {onMapClick && (
                            <button className={styles.mapIconBtn} onClick={(e) => { e.stopPropagation(); onMapClick(item); }} title="Показати на карті">
                                <FaMapMarkedAlt />
                            </button>
                        )}
                        {onDelete && (
                            <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); onDelete(item); }} title="Видалити">
                                <FaTrash />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {items.length === 0 && (
                <div className={styles.emptyList}>
                    Немає даних
                </div>
            )}
        </div>
    </div>
);

export default function ManualSidebar({ selectedCountry, setSelectedCountry, selectedCity, setSelectedCity, selectedDistrict, setSelectedDistrict }) {
    const { t } = useTranslation('admin');
    
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const adminCityIds = currentAdmin?.cities || [];

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    
    const [searchCountry, setSearchCountry] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searchDistrict, setSearchDistrict] = useState('');

    const [modal, setModal] = useState({ isOpen: false, type: '', title: '', placeholder: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null });
    const [mapModal, setMapModal] = useState({ isOpen: false, city: null });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadCountries = useCallback(async () => {
        try { setCountries(await api.geo.getCountries() || []); } catch {}
    }, []);

    useEffect(() => { loadCountries(); }, [loadCountries]);

    useEffect(() => {
        setSearchCity('');
        const loadCities = async (countryId) => { 
            try { 
                const fetchedCities = await api.geo.getCities(countryId) || []; 
                if (isSuperAdmin) {
                    setCities(fetchedCities);
                } else {
                    setCities(fetchedCities.filter(c => adminCityIds.includes(c.id)));
                }
            } catch {} 
        };
        
        if (selectedCountry) loadCities(selectedCountry.id);
        else { setCities([]); setSelectedCity(null); }
    }, [selectedCountry, setSelectedCity, isSuperAdmin, adminCityIds]);

    useEffect(() => {
        setSearchDistrict('');
        const loadDistricts = async (cityId) => { try { setDistricts(await api.geo.getDistricts(cityId) || []); } catch {} };
        if (selectedCity) loadDistricts(selectedCity.id);
        else { setDistricts([]); setSelectedDistrict(null); }
    }, [selectedCity, setSelectedDistrict]);

    const filterList = (list, search) => list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const openModal = (type) => {
        const titles = { country: t('manualSidebar.newCountry'), city: t('manualSidebar.newCity'), district: t('manualSidebar.newDistrict') };
        setModal({ isOpen: true, type, title: titles[type], placeholder: t('manualSidebar.enterName') });
    };

    const openConfirmModal = (type, item) => setConfirmModal({ isOpen: true, type, item });

    const handleCreate = async (name) => {
        setIsSubmitting(true);
        try {
            let newItem;
            if (modal.type === 'country') {
                newItem = await api.geo.createCountry(name);
                setCountries(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedCountry(newItem);
            } else if (modal.type === 'city') {
                newItem = await api.geo.createCity(name, selectedCountry.id);
                setCities(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedCity(newItem);
            } else if (modal.type === 'district') {
                newItem = await api.geo.createDistrict(name, selectedCity.id);
                setDistricts(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedDistrict(newItem);
            }
            setModal({ ...modal, isOpen: false });
        } catch {}
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const { type, item } = confirmModal;
            if (type === 'country') {
                await api.geo.deleteCountry(item.id);
                if (selectedCountry?.id === item.id) setSelectedCountry(null);
                setCountries(prev => prev.filter(c => c.id !== item.id));
            } else if (type === 'city') {
                await api.geo.deleteCity(item.id);
                if (selectedCity?.id === item.id) setSelectedCity(null);
                setCities(prev => prev.filter(c => c.id !== item.id));
            } else if (type === 'district') {
                await api.geo.deleteDistrict(item.id);
                if (selectedDistrict?.id === item.id) setSelectedDistrict(null);
                setDistricts(prev => prev.filter(d => d.id !== item.id));
            }
            setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Помилка видалення: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.sidebar}>
            <SidebarList 
                title={t('manualSidebar.countries')}
                onAdd={isSuperAdmin ? () => openModal('country') : null}
                onDelete={isSuperAdmin ? (country) => openConfirmModal('country', country) : null}
                searchVal={searchCountry} onSearch={setSearchCountry} searchPlaceholder={t('manualSidebar.searchCountry')}
                items={filterList(countries, searchCountry)} selectedItem={selectedCountry} onSelect={setSelectedCountry}
            />

            {selectedCountry && (
                <SidebarList 
                    title={t('manualSidebar.cities')} parentName={selectedCountry.name}
                    onAdd={isSuperAdmin ? () => openModal('city') : null}
                    onDelete={isSuperAdmin ? (city) => openConfirmModal('city', city) : null}
                    searchVal={searchCity} onSearch={setSearchCity} searchPlaceholder={t('manualSidebar.searchCity')}
                    items={filterList(cities, searchCity)} selectedItem={selectedCity} onSelect={setSelectedCity}
                    onMapClick={(city) => setMapModal({ isOpen: true, city })}
                />
            )}

            {selectedCity && (
                <SidebarList 
                    title={t('manualSidebar.districts')} parentName={selectedCity.name}
                    onAdd={() => openModal('district')}
                    onDelete={isSuperAdmin ? (district) => openConfirmModal('district', district) : null}
                    searchVal={searchDistrict} onSearch={setSearchDistrict} searchPlaceholder={t('manualSidebar.searchDistrict')}
                    items={filterList(districts, searchDistrict)} selectedItem={selectedDistrict} onSelect={setSelectedDistrict}
                    showEyeIcon={true}
                    showFreshness={true} 
                />
            )}

            <EntityModal 
                isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })}
                onSubmit={handleCreate} title={modal.title} placeholder={modal.placeholder} isSubmitting={isSubmitting}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleDelete} title={t('manualSidebar.confirmDeleteTitle')}
                message={t('manualSidebar.confirmDeleteMsg', { name: confirmModal.item?.name })}
                isProcessing={isSubmitting}
            />

            <CityMapModal 
                isOpen={mapModal.isOpen} onClose={() => setMapModal({ isOpen: false, city: null })} city={mapModal.city} 
            />
        </div>
    );
}