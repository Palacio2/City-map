import React, { useMemo } from 'react';
import { FaMapMarkerAlt, FaSave, FaGlobe } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';

const CityAssignmentModal = ({ 
    isOpen, onClose, selectedAdmin, availableCities, adminCities, 
    toggleCitySelection, setAdminCities, saveCityAssignments, processingId, t 
}) => {
    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-primary border border-blue-500/20 flex items-center justify-center">
                <FaMapMarkerAlt size={14} /> 
            </div>
            <span>{t('cityModal.title', {defaultValue: 'Видача доступу (Країни та Міста)'})}</span>
        </div>
    );

    const modalActions = (
        <>
            <Button variant="cancel" onClick={onClose} disabled={processingId === selectedAdmin.id} className="!border-transparent !shadow-none">
                {t('cityModal.cancel', {defaultValue: 'Скасувати'})}
            </Button>
            <Button variant="primary" onClick={saveCityAssignments} disabled={processingId === selectedAdmin.id} className="!px-6">
                {processingId === selectedAdmin.id ? t('cityModal.saving', {defaultValue: 'Збереження...'}) : <><FaSave /> {t('cityModal.save', {defaultValue: 'Зберегти'})}</>}
            </Button>
        </>
    );

    const groupedCities = useMemo(() => {
        return availableCities.reduce((acc, city) => {
            const cName = city.countryName || 'Other';
            if (!acc[cName]) acc[cName] = [];
            acc[cName].push(city);
            return acc;
        }, {});
    }, [availableCities]);

    const handleToggleCountry = (citiesInCountry) => {
        if (!setAdminCities) return;
        
        const cityIds = citiesInCountry.map(c => c.id);
        const allSelected = cityIds.every(id => adminCities.includes(id));
        
        if (allSelected) {
            setAdminCities(prev => prev.filter(id => !cityIds.includes(id)));
        } else {
            setAdminCities(prev => [...new Set([...prev, ...cityIds])]);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="650px" actions={modalActions}>
            <div className="p-6">
                <div className="bg-blue-500/5 text-primary px-4 py-3 rounded-xl border border-blue-500/20 text-[0.95rem] font-medium mb-5">
                    Оберіть цілі країни або окремі міста для: <strong className="font-extrabold">{selectedAdmin.email}</strong>
                </div>

                <div className="flex flex-col gap-6 max-h-[55vh] overflow-y-auto pr-2 scrollbar-thin">
                    {Object.keys(groupedCities).length === 0 ? (
                        <div className="text-center text-textMuted py-8">
                            Немає доступних міст
                        </div>
                    ) : (
                        Object.entries(groupedCities).map(([countryName, cities]) => {
                            const allSelected = cities.length > 0 && cities.every(c => adminCities.includes(c.id));
                            const someSelected = cities.some(c => adminCities.includes(c.id));

                            return (
                                <div key={countryName} className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-4 shadow-sm">
                                    <div 
                                        className="flex items-center gap-3 pb-3 border-b border-border cursor-pointer select-none group"
                                        onClick={() => handleToggleCountry(cities)}
                                    >
                                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all ${allSelected ? 'bg-primary border-primary' : someSelected ? 'bg-primary/50 border-primary' : 'bg-main border-border group-hover:border-primary'} shadow-sm`}></div>
                                            {(allSelected || someSelected) && <span className="absolute text-white text-[12px] font-bold">✓</span>}
                                        </div>
                                        <FaGlobe className={`text-[1.1rem] transition-colors ${allSelected ? 'text-primary' : 'text-textMuted group-hover:text-primary'}`} />
                                        <h4 className={`m-0 text-[1.1rem] font-extrabold transition-colors ${allSelected ? 'text-primary' : 'text-textMain group-hover:text-primary'}`}>
                                            {countryName}
                                        </h4>
                                        <span className="ml-auto text-[0.85rem] font-bold text-textMuted bg-main px-2 py-0.5 rounded-md border border-border">
                                            {cities.filter(c => adminCities.includes(c.id)).length} / {cities.length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 pt-1">
                                        {cities.map(city => {
                                            const isActive = adminCities.includes(city.id);
                                            return (
                                                <label 
                                                    key={city.id} 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleCitySelection(city.id);
                                                    }}
                                                    className={`flex items-center gap-3 p-2.5 border-2 rounded-xl cursor-pointer transition-all select-none ${isActive ? 'bg-blue-500/5 border-primary shadow-sm' : 'bg-main border-transparent hover:bg-surface hover:border-border'}`}
                                                >
                                                    <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                                                        <div className={`w-4 h-4 rounded-md border-2 transition-all ${isActive ? 'bg-primary border-primary' : 'bg-surface border-border'} shadow-sm`}></div>
                                                        {isActive && <span className="absolute w-1 h-2 border-solid border-white border-0 border-r-2 border-b-2 rotate-45 mb-0.5"></span>}
                                                    </div>
                                                    <span className={`font-bold text-[0.9rem] ${isActive ? 'text-primary' : 'text-textMain'}`}>{city.name}</span>
                                                </label>
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

export default React.memo(CityAssignmentModal);