import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../services/api';
import EntityModal from './EntityModal';
import ConfirmModal from './ConfirmModal';
import CityMapModal from './CityMapModal';
import { SearchInput } from '../../ui/SearchInput';
import { FaEyeSlash, FaPlus, FaTrash, FaMapMarkedAlt, FaFolderOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/AdminContext';
import { useModals } from '../../ui/ModalContext';

const getFreshnessStatus = (lastUpdated) => {
    if (!lastUpdated) return { color: 'bg-red-500' }; 
    const diffMonths = (new Date().getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths < 3) return { color: 'bg-emerald-500' }; 
    if (diffMonths < 6) return { color: 'bg-amber-500' }; 
    return { color: 'bg-red-500' }; 
};

const SidebarList = ({ title, parentName, onAdd, searchVal, onSearch, searchPlaceholder, items, selectedItem, onSelect, onMapClick, onDelete, showEyeIcon, showFreshness, t }) => (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none"></div>

        <div className="flex justify-between items-center px-1 relative z-10">
            <div className="text-[0.85rem] font-extrabold text-textMain uppercase tracking-widest flex items-center gap-2">
                {title} 
                {parentName && <span className="text-primary bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider text-[0.7rem] shadow-sm">{parentName}</span>}
            </div>
            {onAdd && (
                <button 
                    onClick={onAdd} 
                    className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-success flex items-center justify-center transition-all hover:bg-success hover:text-white hover:shadow-md hover:-translate-y-0.5"
                >
                    <FaPlus size={12} />
                </button>
            )}
        </div>

        <div className="relative z-10">
            <SearchInput value={searchVal} onChange={e => onSearch(e.target.value)} placeholder={searchPlaceholder} className="!bg-main shadow-inner" />
        </div>

        <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin relative z-10">
            {items.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const freshness = showFreshness ? getFreshnessStatus(item.last_updated) : null;
                
                return (
                    <div 
                        key={item.id} 
                        onClick={() => onSelect(item)} 
                        className={`group flex justify-between items-center px-4 py-3 rounded-xl cursor-pointer text-[0.9rem] font-bold transition-all duration-200 border-2 ${isSelected ? 'bg-blue-500/5 border-primary shadow-sm' : 'border-transparent hover:bg-main hover:border-border/50 text-textMain'}`}
                    >
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-3" style={{ color: item.is_available === false ? 'var(--text-muted)' : 'inherit' }}>
                            {showFreshness && (
                                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                                    <div className={`absolute w-2.5 h-2.5 rounded-full ${freshness.color} ${isSelected ? 'animate-ping opacity-75' : 'opacity-20 group-hover:opacity-100 transition-opacity'}`}></div>
                                    <div className={`relative w-2.5 h-2.5 rounded-full ${freshness.color} shadow-sm`}></div>
                                </div>
                            )}
                            <span className="truncate">{item.name}</span>
                            {showEyeIcon && !item.is_available && <FaEyeSlash className="text-textMuted opacity-40 shrink-0 ml-1" size={14} />}
                        </span>
                        
                        <div className={`flex items-center gap-2 transition-all duration-200 shrink-0 ml-2 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {onMapClick && (
                                <button 
                                    className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-[#8b5cf6] hover:text-white hover:border-[#8b5cf6] shadow-sm" 
                                    onClick={(e) => { e.stopPropagation(); onMapClick(item); }}
                                >
                                    <FaMapMarkedAlt size={14} />
                                </button>
                            )}
                            {onDelete && (
                                <button 
                                    className="w-8 h-8 rounded-lg bg-surface border border-border text-textMuted flex items-center justify-center transition-colors hover:bg-danger hover:text-white hover:border-danger shadow-sm" 
                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                >
                                    <FaTrash size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            {items.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center text-textMuted bg-main/50 rounded-xl border border-dashed border-border gap-3 mt-1 shadow-inner">
                    <FaFolderOpen className="text-[2rem] opacity-20" />
                    <span className="text-[0.85rem] font-bold uppercase tracking-wider">{t('admin_manual.sidebar.no_data')}</span>
                </div>
            )}
        </div>
    </div>
);

export default function ManualSidebar({ selectedCountry, setSelectedCountry, selectedCity, setSelectedCity, selectedDistrict, setSelectedDistrict }) {
    const { t } = useTranslation('db');
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

    const { data: countriesData = [] } = useQuery({
        queryKey: ['countries'],
        queryFn: () => api.geo.getCountries()
    });

    const countries = isSuperAdmin ? countriesData : countriesData.filter(c => adminCityIds.some(cityId => cityId)); 

    const { data: citiesData = [] } = useQuery({
        queryKey: ['cities', selectedCountry?.id],
        queryFn: () => api.geo.getCities(selectedCountry.id),
        enabled: !!selectedCountry
    });

    const cities = isSuperAdmin ? citiesData : citiesData.filter(c => adminCityIds.includes(c.id));

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

    const openModal = (type) => {
        const titles = {
            country: t('admin_manual.sidebar.add_country'),
            city: `${t('admin_manual.sidebar.add_city')} (${selectedCountry?.name})`,
            district: `${t('admin_manual.sidebar.add_district')} (${selectedCity?.name})`
        };
        setModal({ isOpen: true, type, title: titles[type], placeholder: t('admin_manual.entity_modal.placeholder') });
    };

    const openConfirmModal = (type, item) => setConfirmModal({ isOpen: true, type, item });

    return (
        <div className="flex flex-col gap-5 pb-5 pr-1">
            <SidebarList 
                title={t('admin_manual.sidebar.countries')} 
                onAdd={isSuperAdmin ? () => openModal('country') : null}
                onDelete={isSuperAdmin ? (country) => openConfirmModal('country', country) : null}
                searchVal={searchCountry} 
                onSearch={setSearchCountry} 
                searchPlaceholder={t('admin_manual.sidebar.search_country')}
                items={filterList(countries, searchCountry)} 
                selectedItem={selectedCountry} 
                onSelect={(c) => { setSelectedCountry(c); setSelectedCity(null); setSelectedDistrict(null); }}
                t={t}
            />

            {selectedCountry && (
                <SidebarList 
                    title={t('admin_manual.sidebar.cities')} 
                    parentName={selectedCountry.name} 
                    onAdd={isSuperAdmin ? () => openModal('city') : null}
                    onDelete={isSuperAdmin ? (city) => openConfirmModal('city', city) : null}
                    searchVal={searchCity} 
                    onSearch={setSearchCity} 
                    searchPlaceholder={t('admin_manual.sidebar.search_city')}
                    items={filterList(cities, searchCity)} 
                    selectedItem={selectedCity} 
                    onSelect={(c) => { setSelectedCity(c); setSelectedDistrict(null); }}
                    onMapClick={(city) => setMapModal({ isOpen: true, city })}
                    t={t}
                />
            )}

            {selectedCity && (
                <SidebarList 
                    title={t('admin_manual.sidebar.districts')} 
                    parentName={selectedCity.name} 
                    onAdd={() => openModal('district')}
                    onDelete={isSuperAdmin ? (district) => openConfirmModal('district', district) : null}
                    searchVal={searchDistrict} 
                    onSearch={setSearchDistrict} 
                    searchPlaceholder={t('admin_manual.sidebar.search_district')}
                    items={filterList(districts, searchDistrict)} 
                    selectedItem={selectedDistrict} 
                    onSelect={setSelectedDistrict}
                    showEyeIcon={true} 
                    showFreshness={true} 
                    t={t}
                />
            )}

            <EntityModal 
                isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })}
                onSubmit={(name) => createMutation.mutate({ type: modal.type, name })} 
                title={modal.title} 
                placeholder={modal.placeholder} 
                isSubmitting={createMutation.isPending}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => deleteMutation.mutate({ type: confirmModal.type, id: confirmModal.item.id })} 
                title={t('admin_manual.sidebar.confirm_delete_title')}
                message={t('admin_manual.sidebar.confirm_delete_msg', { name: confirmModal.item?.name })} 
                isProcessing={deleteMutation.isPending}
            />

            <CityMapModal isOpen={mapModal.isOpen} onClose={() => setMapModal({ isOpen: false, city: null })} city={mapModal.city} />
        </div>
    );
}