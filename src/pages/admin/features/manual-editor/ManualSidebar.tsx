import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@services/api';
import EntityModal from '@admin/core/ui/EntityModal';
import CityMapModal from '@admin/features/manual-editor/CityMapModal';
import { SearchInput } from '@admin/core/ui/SearchInput';
import { FaEyeSlash, FaPlus, FaTrash, FaMapMarkedAlt, FaFolderOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAdmin } from '@admin/core/context/AdminContext';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useModals } from '@admin/core/context/ModalContext';
import { Entity } from './types';

const EMPTY_ARRAY: Entity[] = [];

interface SidebarListProps {
    title: string;
    parentName?: string;
    onAdd?: (() => void) | null;
    searchVal: string;
    onSearch: (val: string) => void;
    searchPlaceholder: string;
    items: Entity[];
    selectedItem: Entity | null;
    onSelect: (item: Entity) => void;
    onMapClick?: ((item: Entity) => void) | null;
    onDelete?: ((item: Entity) => void) | null;
    showEyeIcon?: boolean;
    t: TFunction;
}

const SidebarList = ({ title, parentName, onAdd, searchVal, onSearch, searchPlaceholder, items, selectedItem, onSelect, onMapClick, onDelete, showEyeIcon, t }: SidebarListProps) => (
    <div className="bg-surface border border-[#d6ccbf] dark:border-[#4a3f37] rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
            <div className="text-[11px] font-bold text-textMuted uppercase tracking-wider flex items-center gap-1.5">
                <span>{title}</span>
                {parentName && <span className="text-primary bg-primary-subtle border border-primary/20 px-2 py-0.5 rounded-md text-[10px] font-semibold">{parentName}</span>}
            </div>
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                    title={t('common.add')}
                >
                    <FaPlus className="text-[10px]" />
                </button>
            )}
        </div>
        <SearchInput value={searchVal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)} placeholder={searchPlaceholder} />
        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {items.map((item: Entity) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={`group flex justify-between items-center px-3 py-2 rounded-xl cursor-pointer text-xs font-semibold transition-all border ${
                            isSelected
                                ? 'bg-primary-subtle border-primary/30 text-primary shadow-2xs'
                                : 'border-transparent hover:bg-hover text-textMain'
                        }`}
                    >
                        <span className="flex-1 truncate flex items-center gap-2" style={{ opacity: item.is_available === false ? 0.6 : 1 }}>
                            <span className="truncate">{item.name}</span>
                            {showEyeIcon && !item.is_available && <FaEyeSlash className="text-textMuted text-[10px] shrink-0" />}
                        </span>
                        <div className={`flex items-center gap-1.5 transition-opacity shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {onMapClick && (
                                <button
                                    className="p-1 rounded-lg text-textMuted hover:text-primary hover:bg-surface transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onMapClick(item); }}
                                >
                                    <FaMapMarkedAlt className="text-xs" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    className="p-1 rounded-lg text-textMuted hover:text-rose-600 hover:bg-surface transition-colors"
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
                <div className="py-6 flex flex-col items-center justify-center text-textMuted bg-main/50 rounded-xl border border-dashed border-[#d6ccbf] dark:border-[#4a3f37] gap-1.5">
                    <FaFolderOpen className="text-base opacity-40" />
                    <span className="text-[11px] font-medium">{t('admin_manual.sidebar.no_data')}</span>
                </div>
            )}
        </div>
    </div>
);

interface ManualSidebarProps {
    selectedCountry: Entity | null;
    setSelectedCountry: (val: Entity | null) => void;
    selectedCity: Entity | null;
    setSelectedCity: (val: Entity | null) => void;
    selectedDistrict: Entity | null;
    setSelectedDistrict: (val: Entity | null) => void;
    initialCountryId?: string | null;
    initialCityId?: string | null;
    initialDistrictId?: string | null;
}

export default function ManualSidebar({ selectedCountry, setSelectedCountry, selectedCity, setSelectedCity, selectedDistrict, setSelectedDistrict, initialCountryId, initialCityId, initialDistrictId }: ManualSidebarProps) {
    const { t } = useTranslation('db');
    const { currentAdmin } = useAdmin();
    const { canDo, isSuperAdmin } = useActionGuard();
    const { showAlert, showConfirm } = useModals();
    const queryClient = useQueryClient();
    
    const canCreateCountry = canDo('manual.create.country');
    const canCreateCity = canDo('manual.create.city');
    const canCreateDistrict = canDo('manual.create.district');
    const canDelete = canDo('manual.delete');
    const canGis = canDo('manual.gis');
    
    const adminCityIds = currentAdmin?.cities || [];
    
    const [searchCountry, setSearchCountry] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searchDistrict, setSearchDistrict] = useState('');
    const [modal, setModal] = useState({ isOpen: false, type: '', title: '', placeholder: '' });
    const [mapModal, setMapModal] = useState({ isOpen: false, city: null as Entity | null });

    const { data: countriesData = EMPTY_ARRAY } = useQuery({
        queryKey: ['countries'],
        queryFn: () => api.geo.getCountries()
    });
    
    const countries = isSuperAdmin ? countriesData : countriesData.filter((_c: Entity) => adminCityIds.some((cityId: string) => cityId));

    const { data: citiesData = EMPTY_ARRAY } = useQuery({
        queryKey: ['cities', selectedCountry?.id],
        queryFn: () => api.geo.getCities(selectedCountry?.id || ''),
        enabled: !!selectedCountry
    });
    
    const cities = isSuperAdmin ? citiesData : citiesData.filter((c: Entity) => adminCityIds.includes(c.id));

    const { data: districts = EMPTY_ARRAY } = useQuery({
        queryKey: ['districts', selectedCity?.id],
        queryFn: () => api.geo.getDistricts(selectedCity?.id || ''),
        enabled: !!selectedCity
    });

    const initialCountryResolved = useRef(false);
    useEffect(() => {
        if (!initialCountryResolved.current && initialCountryId && countries.length > 0) {
            const found = countries.find((c: Entity) => c.id === initialCountryId);
            if (found && (!selectedCountry || selectedCountry.name === '...')) {
                setSelectedCountry(found);
            }
            initialCountryResolved.current = true;
        }
    }, [countries, initialCountryId, selectedCountry, setSelectedCountry]);

    const initialCityResolved = useRef(false);
    useEffect(() => {
        if (!initialCityResolved.current && initialCityId && cities.length > 0) {
            const found = cities.find((c: Entity) => c.id === initialCityId);
            if (found && (!selectedCity || selectedCity.name === '...')) {
                setSelectedCity(found);
            }
            initialCityResolved.current = true;
        }
    }, [cities, initialCityId, selectedCity, setSelectedCity]);

    const initialDistrictResolved = useRef(false);
    useEffect(() => {
        if (!initialDistrictResolved.current && initialDistrictId && districts.length > 0) {
            const found = districts.find((d: Entity) => d.id === initialDistrictId);
            if (found && (!selectedDistrict || selectedDistrict.name === '...')) {
                setSelectedDistrict(found);
            }
            initialDistrictResolved.current = true;
        }
    }, [districts, initialDistrictId, selectedDistrict, setSelectedDistrict]);

    const createMutation = useMutation({
        mutationFn: async ({ type, name }: { type: string; name: string }) => {
            if (type === 'country') return api.geo.createCountry(name);
            if (type === 'city') return api.geo.createCity(name, selectedCountry?.id as string);
            if (type === 'district') return api.geo.createDistrict(name, selectedCity?.id as string);
        },
        onSuccess: (data, { type }) => {
            if (type === 'country') { queryClient.invalidateQueries({ queryKey: ['countries'] }); setSelectedCountry(data); }
            if (type === 'city') { 
                queryClient.invalidateQueries({ queryKey: ['cities'] }); 
                queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
                setSelectedCity(data); 
            }
            if (type === 'district') { queryClient.invalidateQueries({ queryKey: ['districts'] }); setSelectedDistrict(data); }
            setModal({ ...modal, isOpen: false });
        },
        onError: (err: Error) => showAlert(t('common.error'), err.message, 'error')
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }: { type: string; id: string }) => {
            if (type === 'country') return api.geo.deleteCountry(id);
            if (type === 'city') return api.geo.deleteCity(id);
            if (type === 'district') return api.geo.deleteDistrict(id);
        },
        onError: (err: Error) => showAlert(t('common.error'), err.message, 'error')
    });

    const filterList = (list: Entity[], search: string) => list.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const handleDeleteEntity = (type: string, item: Entity) => {
        showConfirm(
            t('admin_manual.sidebar.confirm_delete_title'),
            t('admin_manual.sidebar.confirm_delete_msg', { name: item?.name }),
            () => deleteMutation.mutate({ type, id: item.id }, {
                onSuccess: () => {
                    if (type === 'country') { 
                        queryClient.invalidateQueries({ queryKey: ['countries'] }); 
                        if (selectedCountry?.id === item.id) {
                            setSelectedCountry(null);
                            setSelectedCity(null);
                            setSelectedDistrict(null);
                        }
                    }
                    if (type === 'city') { 
                        queryClient.invalidateQueries({ queryKey: ['cities'] }); 
                        if (selectedCity?.id === item.id) {
                            setSelectedCity(null);
                            setSelectedDistrict(null);
                        }
                    }
                    if (type === 'district') { 
                        queryClient.invalidateQueries({ queryKey: ['districts'] }); 
                        if (selectedDistrict?.id === item.id) {
                            setSelectedDistrict(null);
                        }
                    }
                }
            }),
            { confirmVariant: 'danger' }
        );
    };

    const openModal = (type: string) => {
        const titles: Record<string, string> = {
            country: t('admin_manual.sidebar.add_country'),
            city: `${t('admin_manual.sidebar.add_city')} (${selectedCountry?.name})`,
            district: `${t('admin_manual.sidebar.add_district')} (${selectedCity?.name})`
        };
        setModal({ isOpen: true, type, title: titles[type], placeholder: t('admin_manual.entity_modal.placeholder') });
    };


    return (
        <div className="flex flex-col gap-3.5">
            <SidebarList
                title={t('admin_manual.sidebar.countries')}
                onAdd={canCreateCountry ? () => openModal('country') : null}
                onDelete={canDelete ? (country: Entity) => handleDeleteEntity('country', country) : null}
                searchVal={searchCountry}
                onSearch={setSearchCountry}
                searchPlaceholder={t('admin_manual.sidebar.search_country')}
                items={filterList(countries, searchCountry)}
                selectedItem={selectedCountry}
                onSelect={(c: Entity) => { setSelectedCountry(c); setSelectedCity(null); setSelectedDistrict(null); }}
                t={t}
            />
            
            {selectedCountry && (
                <SidebarList
                    title={t('admin_manual.sidebar.cities')}
                    parentName={selectedCountry.name}
                    onAdd={canCreateCity ? () => openModal('city') : null}
                    onDelete={canDelete ? (city: Entity) => handleDeleteEntity('city', city) : null}
                    searchVal={searchCity}
                    onSearch={setSearchCity}
                    searchPlaceholder={t('admin_manual.sidebar.search_city')}
                    items={filterList(cities, searchCity)}
                    selectedItem={selectedCity}
                    onSelect={(c: Entity) => { setSelectedCity(c); setSelectedDistrict(null); }}
                    onMapClick={canGis ? (city: Entity) => setMapModal({ isOpen: true, city }) : null}
                    t={t}
                />
            )}
            
            {selectedCity && (
                <SidebarList
                    title={t('admin_manual.sidebar.districts')}
                    parentName={selectedCity.name}
                    onAdd={canCreateDistrict ? () => openModal('district') : null}
                    onDelete={canDelete ? (district: Entity) => handleDeleteEntity('district', district) : null}
                    searchVal={searchDistrict}
                    onSearch={setSearchDistrict}
                    searchPlaceholder={t('admin_manual.sidebar.search_district')}
                    items={filterList(districts, searchDistrict)}
                    selectedItem={selectedDistrict}
                    onSelect={(d: Entity) => setSelectedDistrict(d)}
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
            
            <CityMapModal isOpen={mapModal.isOpen} onClose={() => setMapModal({ isOpen: false, city: null })} city={mapModal.city} />
        </div>
    );
}