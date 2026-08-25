import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ManualSidebar from '@admin/features/manual-editor/ManualSidebar';
import ManualEditor from '@admin/features/manual-editor/ManualEditor';
import { Entity } from './types';

export default function ManualTab() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Ініціалізуємо базовими значеннями з URL, якщо вони є
    const [selectedCountry, setSelectedCountry] = useState<Entity | null>(() => {
        const id = searchParams.get('country');
        return id ? { id, name: searchParams.get('countryName') || '...' } : null;
    });
    
    const [selectedCity, setSelectedCity] = useState<Entity | null>(() => {
        const id = searchParams.get('city');
        const name = searchParams.get('cityName');
        return id ? { id, name: name || '...' } : null;
    });
    
    const [selectedDistrict, setSelectedDistrict] = useState<Entity | null>(() => {
        const id = searchParams.get('district');
        const name = searchParams.get('districtName');
        return id ? { id, name: name || '...' } : null;
    });

    const isInitialMount = useRef(true);

    // Синхронізація зміни стейту з URL параметрами
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setSearchParams((prevParams) => {
            const newParams = new URLSearchParams(prevParams);
            let changed = false;

            if (selectedCountry) {
                if (newParams.get('country') !== selectedCountry.id || (selectedCountry.name !== '...' && newParams.get('countryName') !== selectedCountry.name)) {
                    newParams.set('country', selectedCountry.id);
                    if (selectedCountry.name && selectedCountry.name !== '...') {
                        newParams.set('countryName', selectedCountry.name);
                    }
                    changed = true;
                }
            } else {
                if (newParams.has('country')) {
                    newParams.delete('country');
                    newParams.delete('countryName');
                    changed = true;
                }
            }

            if (selectedCity) {
                if (newParams.get('city') !== selectedCity.id || (selectedCity.name !== '...' && newParams.get('cityName') !== selectedCity.name)) {
                    newParams.set('city', selectedCity.id);
                    if (selectedCity.name && selectedCity.name !== '...') {
                        newParams.set('cityName', selectedCity.name);
                    }
                    changed = true;
                }
            } else {
                if (newParams.has('city')) {
                    newParams.delete('city');
                    newParams.delete('cityName');
                    changed = true;
                }
            }

            if (selectedDistrict) {
                if (newParams.get('district') !== selectedDistrict.id || (selectedDistrict.name !== '...' && newParams.get('districtName') !== selectedDistrict.name)) {
                    newParams.set('district', selectedDistrict.id);
                    if (selectedDistrict.name && selectedDistrict.name !== '...') {
                        newParams.set('districtName', selectedDistrict.name);
                    }
                    changed = true;
                }
            } else {
                if (newParams.has('district')) {
                    newParams.delete('district');
                    newParams.delete('districtName');
                    changed = true;
                }
            }

            return changed ? newParams : prevParams;
        }, { replace: true });
    }, [selectedCountry, selectedCity, selectedDistrict, setSearchParams]);



    return (
        <div className="flex flex-col lg:flex-row gap-5 w-full h-[calc(100vh-100px)] min-h-[600px]">
            <div className="w-full lg:w-80 shrink-0 flex flex-col h-auto lg:h-full overflow-y-auto pr-1 scrollbar-thin">
                <ManualSidebar
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                    initialCountryId={searchParams.get('country')}
                    initialCityId={searchParams.get('city')}
                    initialDistrictId={searchParams.get('district')}
                />
            </div>
            <div className="flex-1 min-w-0 h-auto lg:h-full overflow-y-auto pr-1 pb-6 scrollbar-thin">
                <ManualEditor
                    selectedCountry={selectedCountry}
                    selectedCity={selectedCity}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                />
            </div>
        </div>
    );
}