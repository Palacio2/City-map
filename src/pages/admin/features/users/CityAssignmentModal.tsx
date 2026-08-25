import React, { useMemo } from 'react';
import { FaMapMarkerAlt, FaSave, FaGlobe, FaCheck } from 'react-icons/fa';
import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { AdminUser } from '@admin/core/types/admin.types';
import { CityData } from './types';

interface CityAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedAdmin: AdminUser | null;
    availableCities: CityData[];
    adminCities: string[];
    toggleCitySelection: (id: string) => void;
    setAdminCities: React.Dispatch<React.SetStateAction<string[]>>;
    saveCityAssignments: () => void;
    processingId: string | null;
    t: (key: string, options?: Record<string, unknown>) => string;
}

const CityAssignmentModal = ({
    isOpen,
    onClose,
    selectedAdmin,
    availableCities,
    adminCities,
    toggleCitySelection,
    setAdminCities,
    saveCityAssignments,
    processingId,
    t
}: CityAssignmentModalProps) => {
    const groupedCities = useMemo(() => {
        if (!availableCities) return {};
        return availableCities.reduce((acc: Record<string, CityData[]>, city: CityData) => {
            const cName = city.countryName || t('admin_users.city_modal.other_countries');
            if (!acc[cName]) acc[cName] = [];
            acc[cName].push(city);
            return acc;
        }, {});
    }, [availableCities, t]);

    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center text-xs">
                <FaMapMarkerAlt />
            </div>
            <span className="text-sm font-bold text-textMain">{t('admin_users.city_modal.title')}</span>
        </div>
    );

    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={onClose} disabled={processingId === selectedAdmin.id}>
                {t('admin_users.city_modal.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={saveCityAssignments} disabled={processingId === selectedAdmin.id}>
                {processingId === selectedAdmin.id ? t('admin_users.city_modal.saving') : <><FaSave className="text-xs" /> {t('admin_users.city_modal.save')}</>}
            </Button>
        </>
    );

    const handleToggleCountry = (citiesInCountry: CityData[]) => {
        if (!setAdminCities) return;
        const cityIds = citiesInCountry.map(c => c.id);
        const allSelected = cityIds.every(id => adminCities.includes(id));
        if (allSelected) {
            setAdminCities((prev: string[]) => prev.filter(id => !cityIds.includes(id)));
        } else {
            setAdminCities((prev: string[]) => [...new Set([...prev, ...cityIds])]);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="600px" actions={modalActions}>
            <div className="flex flex-col gap-4">
                <div className="bg-main/50 text-textMain px-3.5 py-2.5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] text-xs flex items-center justify-between shadow-2xs">
                    <span className="text-textMuted font-medium">{t('admin_users.city_modal.assignment_for')}</span>
                    <span className="font-mono font-bold text-primary bg-primary-subtle px-2.5 py-0.5 rounded-md border border-primary/20">
                        {selectedAdmin.email}
                    </span>
                </div>

                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                    {Object.keys(groupedCities).length === 0 ? (
                        <div className="text-center text-textMuted py-8 text-xs font-medium">
                            {t('admin_users.city_modal.empty')}
                        </div>
                    ) : (
                        Object.entries(groupedCities).map(([countryName, cities]: [string, CityData[]]) => {
                            const selectedCount = cities.filter((c: CityData) => adminCities.includes(c.id)).length;
                            const allSelected = cities.length > 0 && selectedCount === cities.length;

                            return (
                                <div key={countryName} className="flex flex-col gap-2.5 bg-surface border border-[#d6ccbf] dark:border-[#4a3f37] rounded-2xl p-3.5 shadow-2xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-[#d6ccbf] dark:border-[#4a3f37]">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleCountry(cities)}
                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                                        >
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[9px] transition-colors ${
                                                allSelected 
                                                    ? 'bg-primary border-primary text-white' 
                                                    : selectedCount > 0 
                                                        ? 'bg-primary-subtle border-primary text-primary font-bold' 
                                                        : 'bg-main border-[#d6ccbf] dark:border-[#4a3f37] text-transparent'
                                            }`}>
                                                <FaCheck />
                                            </div>
                                            <FaGlobe className="text-textMuted text-xs" />
                                            <span className="text-xs font-bold text-textMain">
                                                {countryName}
                                            </span>
                                        </button>

                                        <span className="text-[11px] font-mono font-bold text-textMuted bg-main px-2 py-0.5 rounded-md border border-[#d6ccbf] dark:border-[#4a3f37]">
                                            {selectedCount} / {cities.length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {cities.map((city: CityData) => {
                                            const isActive = adminCities.includes(city.id);
                                            return (
                                                <button
                                                    key={city.id}
                                                    type="button"
                                                    onClick={() => toggleCitySelection(city.id)}
                                                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                                                        isActive 
                                                            ? 'bg-primary-subtle border-primary/30 text-primary font-bold shadow-2xs' 
                                                            : 'bg-main/40 border-[#d6ccbf] dark:border-[#4a3f37] hover:bg-hover text-textMuted hover:text-textMain'
                                                    }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] shrink-0 transition-colors ${
                                                        isActive ? 'bg-primary border-primary text-white' : 'bg-surface border-[#d6ccbf] dark:border-[#4a3f37] text-transparent'
                                                    }`}>
                                                        <FaCheck />
                                                    </div>
                                                    <span className="truncate">{city.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default CityAssignmentModal;