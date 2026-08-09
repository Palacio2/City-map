import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// @ts-ignore
import { api } from '../../../../services/api';
import EntityModal from './EntityModal';
import ConfirmModal from './ConfirmModal';
import CityMapModal from './CityMapModal';
import { SearchInput } from '../../ui/SearchInput';
import { FaEyeSlash, FaPlus, FaTrash, FaMapMarkedAlt, FaFolderOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../hooks/AdminContext';
import { useModals } from '../../ui/ModalContext';

const SidebarList = ({ title, parentName, onAdd, searchVal, onSearch, searchPlaceholder, items, selectedItem, onSelect, onMapClick, onDelete, showEyeIcon, t }: any) => (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-subtle flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
            <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center gap-1.5">
                <span>{title}</span>
                {parentName && <span className="text-primary bg-primary-subtle px-1.5 py-0.5 rounded text-[10px] font-normal">{parentName}</span>}
            </div>
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="p-1 rounded bg-success-subtle text-success hover:bg-success hover:text-white transition-colors"
                    title={t('common.add')}
                >
                    <FaPlus className="text-[10px]" />
                </button>
            )}
        </div>

        <SearchInput value={searchVal} onChange={(e: any) => onSearch(e.target.value)} placeholder={searchPlaceholder} />

        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {items.map((item: any) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={`group flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors border ${
                            isSelected 
                                ? 'bg-primary-subtle border-primary/30 text-primary font-medium' 
                                : 'border-transparent hover:bg-hover text-textMain'
                        }`}
                    >
                        <span className="flex-1 truncate flex items-center gap-2" style={{ opacity: item.is_available === false ? 0.6 : 1 }}>
                            <span className="truncate">{item.name}</span>
                            {showEyeIcon && !item.is_available && <FaEyeSlash className="text-textMuted text-[10px] shrink-0" />}
                        </span>
                        <div className={`flex items-center gap-1 transition-opacity shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {onMapClick && (
                                <button
                                    className="p-1 rounded text-textMuted hover:text-primary hover:bg-surface transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onMapClick(item); }}
                                >
                                    <FaMapMarkedAlt className="text-xs" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    className="p-1 rounded text-textMuted hover:text-danger hover:bg-surface transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                >
                                    <FaTrash className="text-[10px]" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            {items.length === 0 && (
                <div className="py-6 flex flex-col items-center justify-center text-textMuted bg-main rounded-lg border border-dashed border-border gap-1">
                    <FaFolderOpen className="text-base opacity-40" />
                    <span className="text-[11px] font-medium">{t('admin_manual.sidebar.no_data')}</span>
                </div>
            )}
        </div>
    </div>
);

export default function ManualSidebar({ selectedCountry, setSelectedCountry, selectedCity, setSelectedCity, selectedDistrict, setSelectedDistrict }: any) {
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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null as any });
    const [mapModal, setMapModal] = useState({ isOpen: false, city: null as any });

    const { data: countriesData = [] } = useQuery({
        queryKey: ['countries'],
        queryFn: () => api.geo.getCountries()
    });
    const countries = isSuperAdmin ? countriesData : countriesData.filter((_c: any) => adminCityIds.some(cityId => cityId));

    const { data: citiesData = [] } = useQuery({
        queryKey: ['cities', selectedCountry?.id],
        queryFn: () => api.geo.getCities(selectedCountry.id),
        enabled: !!selectedCountry
    });
    const cities = isSuperAdmin ? citiesData : citiesData.filter((c: any) => adminCityIds.includes(c.id));

    const { data: districts = [] } = useQuery({
        queryKey: ['districts', selectedCity?.id],
        queryFn: () => api.geo.getDistricts(selectedCity.id),
        enabled: !!selectedCity
    });

    const createMutation = useMutation({
        mutationFn: async ({ type, name }: any) => {
            if (type === 'country') return api.geo.createCountry(name);
            if (type === 'city') return api.geo.createCity(name, selectedCountry.id);
            if (type === 'district') return api.geo.createDistrict(name, selectedCity.id);
        },
        onSuccess: (data, { type }) => {
            if (type === 'country') { queryClient.invalidateQueries({ queryKey: ['countries'] }); setSelectedCountry(data); }
            if (type === 'city') { queryClient.invalidateQueries({ queryKey: ['cities'] }); setSelectedCity(data); }
            if (type === 'district') { queryClient.invalidateQueries({ queryKey: ['districts'] }); setSelectedDistrict(data); }
            setModal({ ...modal, isOpen: false });
        },
        onError: (err: any) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }: any) => {
            if (type === 'country') return api.geo.deleteCountry(id);
            if (type === 'city') return api.geo.deleteCity(id);
            if (type === 'district') return api.geo.deleteDistrict(id);
        },
        onSuccess: (_, { type, id }) => {
            if (type === 'country') { queryClient.invalidateQueries({ queryKey: ['countries'] }); if (selectedCountry?.id === id) setSelectedCountry(null); }
            if (type === 'city') { queryClient.invalidateQueries({ queryKey: ['cities'] }); if (selectedCity?.id === id) setSelectedCity(null); }
            if (type === 'district') { queryClient.invalidateQueries({ queryKey: ['districts'] }); if (selectedDistrict?.id === id) setSelectedDistrict(null); }
            setConfirmModal({ ...confirmModal, isOpen: false });
        },
        onError: (err: any) => showAlert(t('common.error'), err.message, 'error')
    });

    const filterList = (list: any[], search: string) => list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const openModal = (type: string) => {
        const titles: Record<string, string> = {
            country: t('admin_manual.sidebar.add_country'),
            city: `${t('admin_manual.sidebar.add_city')} (${selectedCountry?.name})`,
            district: `${t('admin_manual.sidebar.add_district')} (${selectedCity?.name})`
        };
        setModal({ isOpen: true, type, title: titles[type], placeholder: t('admin_manual.entity_modal.placeholder') });
    };

    const openConfirmModal = (type: string, item: any) => setConfirmModal({ isOpen: true, type, item });

    return (
        <div className="flex flex-col gap-3">
            <SidebarList
                title={t('admin_manual.sidebar.countries')}
                onAdd={isSuperAdmin ? () => openModal('country') : null}
                onDelete={isSuperAdmin ? (country: any) => openConfirmModal('country', country) : null}
                searchVal={searchCountry}
                onSearch={setSearchCountry}
                searchPlaceholder={t('admin_manual.sidebar.search_country')}
                items={filterList(countries, searchCountry)}
                selectedItem={selectedCountry}
                onSelect={(c: any) => { setSelectedCountry(c); setSelectedCity(null); setSelectedDistrict(null); }}
                t={t}
            />
            {selectedCountry && (
                <SidebarList
                    title={t('admin_manual.sidebar.cities')}
                    parentName={selectedCountry.name}
                    onAdd={isSuperAdmin ? () => openModal('city') : null}
                    onDelete={isSuperAdmin ? (city: any) => openConfirmModal('city', city) : null}
                    searchVal={searchCity}
                    onSearch={setSearchCity}
                    searchPlaceholder={t('admin_manual.sidebar.search_city')}
                    items={filterList(cities, searchCity)}
                    selectedItem={selectedCity}
                    onSelect={(c: any) => { setSelectedCity(c); setSelectedDistrict(null); }}
                    onMapClick={(city: any) => setMapModal({ isOpen: true, city })}
                    t={t}
                />
            )}
            {selectedCity && (
                <SidebarList
                    title={t('admin_manual.sidebar.districts')}
                    parentName={selectedCity.name}
                    onAdd={() => openModal('district')}
                    onDelete={isSuperAdmin ? (district: any) => openConfirmModal('district', district) : null}
                    searchVal={searchDistrict}
                    onSearch={setSearchDistrict}
                    searchPlaceholder={t('admin_manual.sidebar.search_district')}
                    items={filterList(districts, searchDistrict)}
                    selectedItem={selectedDistrict}
                    onSelect={setSelectedDistrict}
                    showEyeIcon={true}
                    t={t}
                />
            )}
            <EntityModal
                isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })}
                onSubmit={(name: string) => createMutation.mutate({ type: modal.type, name })}
                title={modal.title}
                placeholder={modal.placeholder}
                isSubmitting={createMutation.isPending}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => deleteMutation.mutate({ type: confirmModal.type, id: confirmModal.item.id })}
                title={t('admin_manual.sidebar.confirm_delete_title', 'Видалити об\'єкт?')}
                message={t('admin_manual.sidebar.confirm_delete_msg', { name: confirmModal.item?.name, defaultValue: `Ви дійсно хочете видалити ${confirmModal.item?.name}?` })}
                isProcessing={deleteMutation.isPending}
            />
            <CityMapModal isOpen={mapModal.isOpen} onClose={() => setMapModal({ isOpen: false, city: null })} city={mapModal.city} />
        </div>
    );
}