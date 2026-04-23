import React, { useState, useEffect } from 'react';
import ManualSidebar from './ManualSidebar';
import ManualEditor from './ManualEditor';

export default function ManualTab() {
    // Ініціалізація станів з localStorage
    const [selectedCountry, setSelectedCountry] = useState(() => {
        const saved = localStorage.getItem('manual_country');
        return saved ? JSON.parse(saved) : null;
    });
    
    const [selectedCity, setSelectedCity] = useState(() => {
        const saved = localStorage.getItem('manual_city');
        return saved ? JSON.parse(saved) : null;
    });
    
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    // Збереження вибору в localStorage
    useEffect(() => {
        if (selectedCountry) {
            localStorage.setItem('manual_country', JSON.stringify(selectedCountry));
        } else {
            localStorage.removeItem('manual_country');
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedCity) {
            localStorage.setItem('manual_city', JSON.stringify(selectedCity));
        } else {
            localStorage.removeItem('manual_city');
        }
    }, [selectedCity]);

    // Скидання вибору при зміні батьківських елементів
    useEffect(() => {
        if (!selectedCountry) {
            setSelectedCity(null);
            setSelectedDistrict(null);
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (!selectedCity) {
            setSelectedDistrict(null);
        }
    }, [selectedCity]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full h-[calc(100vh-140px)] min-h-[600px] overflow-visible lg:overflow-hidden pb-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Ліва колонка: Списки вибору */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full max-h-[50vh] lg:max-h-none overflow-y-auto pr-1 scrollbar-thin">
                <ManualSidebar 
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                />
            </div>

            {/* Права колонка: Редактор даних */}
            <div className="flex-1 min-w-0 h-auto lg:h-full overflow-y-auto pr-0 lg:pr-2 pb-6 scrollbar-thin relative">
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