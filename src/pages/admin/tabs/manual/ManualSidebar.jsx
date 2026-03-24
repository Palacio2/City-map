import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../services/api';
import EntityModal from './EntityModal';
import ConfirmModal from './ConfirmModal';
import CityMapModal from './CityMapModal';
import { SearchInput } from '../../ui/SearchInput';
import { FaEyeSlash, FaPlus, FaTrash, FaMapMarkedAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/AdminContext';
import { useModals } from '../../ui/ModalContext';

const getFreshnessColor = (lastUpdated) => {
    if (!lastUpdated) return '#ef4444'; 
    const diffMonths = (new Date().getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths < 3) return '#10b981'; 
    if (diffMonths < 6) return '#f59e0b'; 
    return '#ef4444'; 
};

const SidebarList = ({ title, parentName, onAdd, searchVal, onSearch, searchPlaceholder, items, selectedItem, onSelect, onMapClick, onDelete, showEyeIcon, showFreshness }) => (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="text-[1.05rem] font-bold text-textMain flex items-center gap-2.5 tracking-tight">
                {title} {parentName && <span className="text-[0.8rem] text-primary font-extrabold bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">{parentName}</span>}
            </div>
            {onAdd && (
                <button onClick={onAdd} className="w-8 h-8 rounded-md bg-blue-500/5 text-primary border border-blue-500/20 flex items-center justify-center transition-all hover:bg-primary hover:text-white shadow-sm">
                    <FaPlus size={12} />
                </button>
            )}
        </div>
        <SearchInput value={searchVal} onChange={e => onSearch(e.target.value)} placeholder={searchPlaceholder} />
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {items.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => onSelect(item)} 
                    className={`px-4 py-2.5 rounded-md cursor-pointer text-[0.9rem] flex justify-between items-center transition-all border-2 group ${selectedItem?.id === item.id ? 'bg-blue-500/5 text-primary font-bold border-primary shadow-sm' : 'border-transparent bg-main text-textMain hover:bg-hover hover:border-border font-semibold'}`}
                >
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-3" style={{ color: item.is_available === false ? 'var(--text-muted)' : 'inherit' }}>
                        {showFreshness && <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: getFreshnessColor(item.last_updated) }} />}
                        {item.name} 
                        {showEyeIcon && !item.is_available && <FaEyeSlash className="ml-auto text-textMuted opacity-50" />}
                    </span>
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                        {onMapClick && <button className="bg-surface border border-border text-textMuted w-7 h-7 rounded-md flex items-center justify-center transition-all shadow-sm hover:bg-primary hover:text-white hover:border-primary" onClick={(e) => { e.stopPropagation(); onMapClick(item); }}><FaMapMarkedAlt size={12} /></button>}
                        {onDelete && <button className="bg-surface border border-border text-textMuted w-7 h-7 rounded-md flex items-center justify-center transition-all shadow-sm hover:bg-danger hover:text-white hover:border-danger" onClick={(e) => { e.stopPropagation(); onDelete(item); }}><FaTrash size={12} /></button>}
                    </div>
                </div>
            ))}
            {items.length === 0 && <div className="p-6 text-center text-textMuted font-medium bg-main rounded-md text-[0.9rem] border border-dashed border-border">Немає даних</div>}
        </div>
    </div>
);

export default function ManualSidebar({ selectedCountry, setSelectedCountry, selectedCity, setSelectedCity, selectedDistrict, setSelectedDistrict }) {
    const { t } = useTranslation('adminManual');
    const { currentAdmin } = useAdmin();
    const { showAlert } = useModals();
    const queryClient = useQueryClient();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const adminCityIds = currentAdmin?.cities || [];

    const [searchCountry, setSearchCountry] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searchDistrict, setSearchDistrict] = useState('');

    const [modal, setModal] = useState({ isOpen: false, type: '', title: '', placeholder: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null });
    const [mapModal, setMapModal] = useState({ isOpen: false, city: null });

    // React Query для Країн
    const { data: countriesData = [] } = useQuery({
        queryKey: ['countries'],
        queryFn: () => api.geo.getCountries()
    });

    const countries = isSuperAdmin ? countriesData : countriesData.filter(c => adminCityIds.some(cityId => cityId)); // спрощена фільтрація, бо сервер має повертати дозволені міста

    // React Query для Міст
    const { data: citiesData = [] } = useQuery({
        queryKey: ['cities', selectedCountry?.id],
        queryFn: () => api.geo.getCities(selectedCountry.id),
        enabled: !!selectedCountry
    });

    const cities = isSuperAdmin ? citiesData : citiesData.filter(c => adminCityIds.includes(c.id));

    // React Query для Районів
    const { data: districts = [] } = useQuery({
        queryKey: ['districts', selectedCity?.id],
        queryFn: () => api.geo.getDistricts(selectedCity.id),
        enabled: !!selectedCity
    });

    const createMutation = useMutation({
        mutationFn: async ({ type, name }) => {
            if (type === 'country') return api.geo.createCountry(name);
            if (type === 'city') return api.geo.createCity(name, selectedCountry.id);
            if (type === 'district') return api.geo.createDistrict(name, selectedCity.id);
        },
        onSuccess: (data, { type }) => {
            if (type === 'country') { queryClient.invalidateQueries(['countries']); setSelectedCountry(data); }
            if (type === 'city') { queryClient.invalidateQueries(['cities']); setSelectedCity(data); }
            if (type === 'district') { queryClient.invalidateQueries(['districts']); setSelectedDistrict(data); }
            setModal({ ...modal, isOpen: false });
        },
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }) => {
            if (type === 'country') return api.geo.deleteCountry(id);
            if (type === 'city') return api.geo.deleteCity(id);
            if (type === 'district') return api.geo.deleteDistrict(id);
        },
        onSuccess: (_, { type, id }) => {
            if (type === 'country') { queryClient.invalidateQueries(['countries']); if (selectedCountry?.id === id) setSelectedCountry(null); }
            if (type === 'city') { queryClient.invalidateQueries(['cities']); if (selectedCity?.id === id) setSelectedCity(null); }
            if (type === 'district') { queryClient.invalidateQueries(['districts']); if (selectedDistrict?.id === id) setSelectedDistrict(null); }
            setConfirmModal({ ...confirmModal, isOpen: false });
        },
        onError: (err) => showAlert(t('common.error'), err.message, 'error')
    });

    const filterList = (list, search) => list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const openModal = (type) => setModal({ isOpen: true, type, title: t(`manualSidebar.new${type.charAt(0).toUpperCase() + type.slice(1)}`), placeholder: t('manualSidebar.enterName') });
    const openConfirmModal = (type, item) => setConfirmModal({ isOpen: true, type, item });

    return (
        <div className="flex flex-col gap-6 pb-5">
            <SidebarList 
                title={t('manualSidebar.countries')} onAdd={isSuperAdmin ? () => openModal('country') : null}
                onDelete={isSuperAdmin ? (country) => openConfirmModal('country', country) : null}
                searchVal={searchCountry} onSearch={setSearchCountry} searchPlaceholder={t('manualSidebar.searchCountry')}
                items={filterList(countries, searchCountry)} selectedItem={selectedCountry} onSelect={(c) => { setSelectedCountry(c); setSelectedCity(null); setSelectedDistrict(null); }}
            />

            {selectedCountry && (
                <SidebarList 
                    title={t('manualSidebar.cities')} parentName={selectedCountry.name} onAdd={isSuperAdmin ? () => openModal('city') : null}
                    onDelete={isSuperAdmin ? (city) => openConfirmModal('city', city) : null}
                    searchVal={searchCity} onSearch={setSearchCity} searchPlaceholder={t('manualSidebar.searchCity')}
                    items={filterList(cities, searchCity)} selectedItem={selectedCity} onSelect={(c) => { setSelectedCity(c); setSelectedDistrict(null); }}
                    onMapClick={(city) => setMapModal({ isOpen: true, city })}
                />
            )}

            {selectedCity && (
                <SidebarList 
                    title={t('manualSidebar.districts')} parentName={selectedCity.name} onAdd={() => openModal('district')}
                    onDelete={isSuperAdmin ? (district) => openConfirmModal('district', district) : null}
                    searchVal={searchDistrict} onSearch={setSearchDistrict} searchPlaceholder={t('manualSidebar.searchDistrict')}
                    items={filterList(districts, searchDistrict)} selectedItem={selectedDistrict} onSelect={setSelectedDistrict}
                    showEyeIcon={true} showFreshness={true} 
                />
            )}

            <EntityModal 
                isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })}
                onSubmit={(name) => createMutation.mutate({ type: modal.type, name })} title={modal.title} placeholder={modal.placeholder} isSubmitting={createMutation.isPending}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => deleteMutation.mutate({ type: confirmModal.type, id: confirmModal.item.id })} title={t('manualSidebar.confirmDeleteTitle')}
                message={t('manualSidebar.confirmDeleteMsg', { name: confirmModal.item?.name })} isProcessing={deleteMutation.isPending}
            />

            <CityMapModal isOpen={mapModal.isOpen} onClose={() => setMapModal({ isOpen: false, city: null })} city={mapModal.city} />
        </div>
    );
}