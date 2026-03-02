import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../../services/api';
import EntityModal from './EntityModal';
import ConfirmModal from './ConfirmModal';
import { FaEyeSlash } from 'react-icons/fa';
import styles from './ManualSidebar.module.css';

export default function ManualSidebar({ 
    selectedCountry, setSelectedCountry, 
    selectedCity, setSelectedCity, 
    selectedDistrict, setSelectedDistrict 
}) {
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    
    const [searchCountry, setSearchCountry] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searchDistrict, setSearchDistrict] = useState('');

    const [modal, setModal] = useState({ isOpen: false, type: '', title: '', placeholder: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { loadCountries(); }, []);

    useEffect(() => {
        setSearchCity('');
        if (selectedCountry) loadCities(selectedCountry.id);
        else { setCities([]); setSelectedCity(null); }
    }, [selectedCountry]);

    useEffect(() => {
        setSearchDistrict('');
        if (selectedCity) loadDistricts(selectedCity.id);
        else { setDistricts([]); setSelectedDistrict(null); }
    }, [selectedCity]);

    const loadCountries = async () => { try { setCountries(await api.geo.getCountries() || []); } catch (e) {} };
    const loadCities = async (countryId) => { try { setCities(await api.geo.getCities(countryId) || []); } catch (e) {} };
    const loadDistricts = async (cityId) => { try { setDistricts(await api.geo.getDistricts(cityId) || []); } catch (e) {} };

    const openModal = (type) => {
        let title = '';
        let placeholder = '';
        if (type === 'country') { title = '🗺️ Додати нову країну'; placeholder = 'Наприклад: Polska'; } 
        else if (type === 'city') { title = `🏙️ Нове місто в ${selectedCountry?.name || ''}`; placeholder = 'Наприклад: Warszawa'; } 
        else if (type === 'district') { title = `🏘️ Новий район в ${selectedCity?.name || ''}`; placeholder = 'Наприклад: Mokotów'; }
        setModal({ isOpen: true, type, title, placeholder });
    };

    const handleModalSubmit = async (name) => {
        setIsSubmitting(true);
        try {
            if (modal.type === 'country') {
                const newC = await api.geo.createCountry(name);
                setCountries(prev => [...prev, newC]);
                setSelectedCountry(newC);
            } else if (modal.type === 'city') {
                const newC = await api.geo.createCity(name, selectedCountry.id);
                setCities(prev => [...prev, newC]);
                setSelectedCity(newC);
            } else if (modal.type === 'district') {
                const newD = await api.geo.createDistrict(name, selectedCity.id);
                setDistricts(prev => [...prev, newD]);
                setSelectedDistrict(newD);
            }
            setModal({ ...modal, isOpen: false });
        } catch (e) {} 
        finally { setIsSubmitting(false); }
    };

    const openConfirmModal = (type, item) => {
        setConfirmModal({ isOpen: true, type, item });
    };

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true);
        try {
            if (confirmModal.type === 'city') {
                await api.geo.deleteCity(confirmModal.item.id);
                setCities(prev => prev.filter(c => c.id !== confirmModal.item.id));
                if (selectedCity?.id === confirmModal.item.id) setSelectedCity(null);
            } else if (confirmModal.type === 'district') {
                await api.geo.deleteDistrict(confirmModal.item.id);
                setDistricts(prev => prev.filter(d => d.id !== confirmModal.item.id));
                if (selectedDistrict?.id === confirmModal.item.id) setSelectedDistrict(null);
            }
            setConfirmModal({ isOpen: false, type: '', item: null });
        } catch (e) {} 
        finally { setIsSubmitting(false); }
    };

    const filteredCountries = useMemo(() => countries.filter(c => c.name.toLowerCase().includes(searchCountry.toLowerCase())), [countries, searchCountry]);
    const filteredCities = useMemo(() => cities.filter(c => c.name.toLowerCase().includes(searchCity.toLowerCase())), [cities, searchCity]);
    const filteredDistricts = useMemo(() => districts.filter(d => d.name.toLowerCase().includes(searchDistrict.toLowerCase())), [districts, searchDistrict]);

    return (
        <div className={styles.sidebar}>
            <EntityModal 
                isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })}
                onSubmit={handleModalSubmit} title={modal.title} placeholder={modal.placeholder} isSubmitting={isSubmitting}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, type: '', item: null })}
                onConfirm={handleDeleteConfirm}
                title="⚠️ Підтвердження видалення"
                message={`Ви дійсно хочете видалити ${confirmModal.type === 'city' ? 'місто' : 'район'} "${confirmModal.item?.name}"? Всі пов'язані з ним дані можуть бути втрачені назавжди.`}
                isProcessing={isSubmitting}
            />

            <div className={styles.listBlock}>
                <div className={styles.listHeader}>
                    <div className={styles.listTitle}>🗺️ Країни</div>
                    <button onClick={() => openModal('country')} className={styles.addGhostBtn}>+ Додати</button>
                </div>
                <input type="text" placeholder="Пошук країни..." className={styles.searchInput} value={searchCountry} onChange={e => setSearchCountry(e.target.value)} />
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
                        <div className={styles.listTitle}>🏙️ Міста <span className={styles.parentName}>({selectedCountry.name})</span></div>
                        <button onClick={() => openModal('city')} className={styles.addGhostBtn}>+ Додати</button>
                    </div>
                    <input type="text" placeholder="Пошук міста..." className={styles.searchInput} value={searchCity} onChange={e => setSearchCity(e.target.value)} />
                    <div className={styles.list}>
                        {filteredCities.map(c => (
                            <div key={c.id} onClick={() => setSelectedCity(c)} className={`${styles.listItem} ${selectedCity?.id === c.id ? styles.listItemSelected : ''}`}>
                                <span className={styles.itemText}>{c.name}</span>
                                <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); openConfirmModal('city', c); }} title="Видалити">🗑️</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedCity && (
                <div className={styles.listBlock}>
                    <div className={styles.listHeader}>
                        <div className={styles.listTitle}>🏘️ Райони <span className={styles.parentName}>({selectedCity.name})</span></div>
                        <button onClick={() => openModal('district')} className={styles.addGhostBtn}>+ Додати</button>
                    </div>
                    <input type="text" placeholder="Пошук району..." className={styles.searchInput} value={searchDistrict} onChange={e => setSearchDistrict(e.target.value)} />
                    <div className={styles.list}>
                        {filteredDistricts.map(d => (
                            <div key={d.id} onClick={() => setSelectedDistrict(d)} className={`${styles.listItem} ${selectedDistrict?.id === d.id ? styles.listItemSelected : ''}`}>
                                <span className={styles.itemText} style={{ color: d.is_available ? 'inherit' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {d.name} {!d.is_available && <FaEyeSlash size={12} title="Приховано" />}
                                </span>
                                <button className={styles.deleteIconBtn} onClick={(e) => { e.stopPropagation(); openConfirmModal('district', d); }} title="Видалити">🗑️</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}