import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../../../services/api';
import EntityModal from './EntityModal';
import ConfirmModal from './ConfirmModal';
import CityMapModal from './CityMapModal';
import { FaEyeSlash, FaPlus, FaTrash, FaMapMarkedAlt } from 'react-icons/fa';
import styles from './ManualSidebar.module.css';
import { useTranslation } from 'react-i18next';

export default function ManualSidebar({ 
    selectedCountry, setSelectedCountry, 
    selectedCity, setSelectedCity, 
    selectedDistrict, setSelectedDistrict 
}) {
    const { t } = useTranslation('admin');
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
        try { setCountries(await api.geo.getCountries() || []); } catch {} // Виправлено warning
    }, []);

    useEffect(() => { loadCountries(); }, [loadCountries]);

    useEffect(() => {
        setSearchCity('');
        const loadCities = async (countryId) => {
            try { setCities(await api.geo.getCities(countryId) || []); } catch {} // Виправлено warning
        };

        if (selectedCountry) loadCities(selectedCountry.id);
        else { setCities([]); setSelectedCity(null); }
    }, [selectedCountry, setSelectedCity]);

    useEffect(() => {
        setSearchDistrict('');
        const loadDistricts = async (cityId) => {
            try { setDistricts(await api.geo.getDistricts(cityId) || []); } catch {} // Виправлено warning
        };

        if (selectedCity) loadDistricts(selectedCity.id);
        else { setDistricts([]); setSelectedDistrict(null); }
    }, [selectedCity, setSelectedDistrict]);

    const filteredCountries = useMemo(() => countries.filter(c => c.name.toLowerCase().includes(searchCountry.toLowerCase())), [countries, searchCountry]);
    const filteredCities = useMemo(() => cities.filter(c => c.name.toLowerCase().includes(searchCity.toLowerCase())), [cities, searchCity]);
    const filteredDistricts = useMemo(() => districts.filter(d => d.name.toLowerCase().includes(searchDistrict.toLowerCase())), [districts, searchDistrict]);

    const openModal = (type) => {
        const titles = { country: t('manualSidebar.newCountry'), city: t('manualSidebar.newCity'), district: t('manualSidebar.newDistrict') };
        setModal({ isOpen: true, type, title: titles[type], placeholder: t('manualSidebar.enterName') });
    };

    const openConfirmModal = (type, item) => {
        setConfirmModal({ isOpen: true, type, item });
    };

    const handleCreate = async (name) => {
        setIsSubmitting(true);
        try {
            if (modal.type === 'country') {
                const newC = await api.geo.createCountry(name);
                setCountries(prev => [...prev, newC].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedCountry(newC);
            } else if (modal.type === 'city') {
                const newC = await api.geo.createCity(name, selectedCountry.id);
                setCities(prev => [...prev, newC].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedCity(newC);
            } else if (modal.type === 'district') {
                const newD = await api.geo.createDistrict(name, selectedCity.id);
                setDistricts(prev => [...prev, newD].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedDistrict(newD);
            }
            setModal({ ...modal, isOpen: false });
        } catch {} // Виправлено warning
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
        } catch {} // Виправлено warning
        setIsSubmitting(false);
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.listBlock}>
                <div className={styles.listHeader}>
                    <div className={styles.listTitle}>{t('manualSidebar.countries')}</div>
                    <button onClick={() => openModal('country')} className={styles.addGhostBtn}><FaPlus /> {t('manualSidebar.addBtn')}</button>
                </div>
                <input type="text" placeholder={t('manualSidebar.searchCountry')} className={styles.searchInput} value={searchCountry} onChange={e => setSearchCountry(e.target.value)} />
                <div className={styles.list}>
                    {filteredCountries.map(c => (
                        <div key={c.id} onClick={() => setSelectedCountry(c)} className={`${styles.listItem} ${selectedCountry?.id === c.id ? styles.listItemSelected : ''}`}>
                            <span className={styles.itemText}>{c.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {selectedCountry && (
                <div className={styles.listBlock}>
                    <div className={styles.listHeader}>
                        <div className={styles.listTitle}>{t('manualSidebar.cities')} <span className={styles.parentName}>({selectedCountry.name})</span></div>
                        <button onClick={() => openModal('city')} className={styles.addGhostBtn}><FaPlus /> {t('manualSidebar.addBtn')}</button>
                    </div>
                    <input type="text" placeholder={t('manualSidebar.searchCity')} className={styles.searchInput} value={searchCity} onChange={e => setSearchCity(e.target.value)} />
                    <div className={styles.list}>
                        {filteredCities.map(c => (
                            <div key={c.id} onClick={() => setSelectedCity(c)} className={`${styles.listItem} ${selectedCity?.id === c.id ? styles.listItemSelected : ''}`}>
                                <span className={styles.itemText}>{c.name}</span>
                                <div className={styles.actionGroup}>
                                    <button className={styles.mapIconBtn} onClick={(e) => { e.stopPropagation(); setMapModal({ isOpen: true, city: c }); }}><FaMapMarkedAlt /></button>
                                    <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); openConfirmModal('city', c); }}><FaTrash /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedCity && (
                <div className={styles.listBlock}>
                    <div className={styles.listHeader}>
                        <div className={styles.listTitle}>{t('manualSidebar.districts')} <span className={styles.parentName}>({selectedCity.name})</span></div>
                        <button onClick={() => openModal('district')} className={styles.addGhostBtn}><FaPlus /> {t('manualSidebar.addBtn')}</button>
                    </div>
                    <input type="text" placeholder={t('manualSidebar.searchDistrict')} className={styles.searchInput} value={searchDistrict} onChange={e => setSearchDistrict(e.target.value)} />
                    <div className={styles.list}>
                        {filteredDistricts.map(d => (
                            <div key={d.id} onClick={() => setSelectedDistrict(d)} className={`${styles.listItem} ${selectedDistrict?.id === d.id ? styles.listItemSelected : ''}`}>
                                <span className={styles.itemText} style={{ color: d.is_available ? 'inherit' : '#94a3b8' }}>
                                    {d.name} {!d.is_available && <FaEyeSlash style={{marginLeft: '6px'}} size={12} />}
                                </span>
                                <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); openConfirmModal('district', d); }}><FaTrash /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <EntityModal 
                isOpen={modal.isOpen} 
                onClose={() => setModal({ ...modal, isOpen: false })}
                onSubmit={handleCreate}
                title={modal.title}
                placeholder={modal.placeholder}
                isSubmitting={isSubmitting}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleDelete}
                title={t('manualSidebar.confirmDeleteTitle')}
                message={t('manualSidebar.confirmDeleteMsg', { name: confirmModal.item?.name })}
                isProcessing={isSubmitting}
            />

            <CityMapModal 
                isOpen={mapModal.isOpen} 
                onClose={() => setMapModal({ isOpen: false, city: null })} 
                city={mapModal.city} 
            />
        </div>
    );
}