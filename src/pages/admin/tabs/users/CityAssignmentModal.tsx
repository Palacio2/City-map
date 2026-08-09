import { useMemo } from 'react';
import { FaMapMarkerAlt, FaSave, FaGlobe, FaCheck } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';

const CityAssignmentModal = ({
    isOpen, onClose, selectedAdmin, availableCities, adminCities,
    toggleCitySelection, setAdminCities, saveCityAssignments, processingId, t
}: any) => {
    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-primary text-sm" />
            <span className="text-sm font-semibold text-textMain">{t('admin_users.city_modal.title')}</span>
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

    const groupedCities = useMemo(() => {
        return availableCities.reduce((acc: any, city: any) => {
            const cName = city.countryName || 'Інші країни';
            if (!acc[cName]) acc[cName] = [];
            acc[cName].push(city);
            return acc;
        }, {});
    }, [availableCities]);

    const handleToggleCountry = (citiesInCountry: any[]) => {
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
            <div className="p-4 flex flex-col gap-4">
                
                <div className="bg-main/60 text-textMain px-3 py-2 rounded-xl border border-border text-xs flex items-center justify-between">
                    <span className="text-textMuted">Призначення міст для:</span>
                    <span className="font-mono font-medium text-primary bg-primary-subtle px-2 py-0.5 rounded border border-primary/20">
                        {selectedAdmin.email}
                    </span>
                </div>

                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                    {Object.keys(groupedCities).length === 0 ? (
                        <div className="text-center text-textMuted py-8 text-xs">
                            {t('admin_users.city_modal.empty')}
                        </div>
                    ) : (
                        Object.entries(groupedCities).map(([countryName, cities]: [string, any]) => {
                            const selectedCount = cities.filter((c: any) => adminCities.includes(c.id)).length;
                            const allSelected = cities.length > 0 && selectedCount === cities.length;

                            return (
                                <div key={countryName} className="flex flex-col gap-2.5 bg-surface border border-border rounded-xl p-3 shadow-2xs">
                                    
                                    <div className="flex items-center justify-between pb-2 border-b border-border">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleCountry(cities)}
                                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] transition-colors ${
                                                allSelected 
                                                    ? 'bg-primary border-primary text-white' 
                                                    : selectedCount > 0 
                                                        ? 'bg-primary-subtle border-primary text-primary' 
                                                        : 'bg-main border-border text-transparent'
                                            }`}>
                                                <FaCheck />
                                            </div>
                                            <FaGlobe className="text-textMuted text-xs" />
                                            <span className="text-xs font-semibold text-textMain">
                                                {countryName}
                                            </span>
                                        </button>

                                        <span className="text-[11px] font-mono text-textMuted bg-main px-2 py-0.5 rounded border border-border">
                                            {selectedCount} / {cities.length}
                                        </span>
                                    </div>

                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {cities.map((city: any) => {
                                            const isActive = adminCities.includes(city.id);
                                            return (
                                                <button
                                                    key={city.id}
                                                    type="button"
                                                    onClick={() => toggleCitySelection(city.id)}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-colors ${
                                                        isActive 
                                                            ? 'bg-primary-subtle border-primary/30 text-primary font-medium shadow-2xs' 
                                                            : 'bg-main/50 border-border hover:bg-hover text-textMuted hover:text-textMain'
                                                    }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] shrink-0 transition-colors ${
                                                        isActive ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-transparent'
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