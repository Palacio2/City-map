import React, { useState, useEffect } from 'react';
import ManualSidebar from './ManualSidebar';
import ManualEditor from './ManualEditor';

export default function ManualTab() {
    const [selectedCountry, setSelectedCountry] = useState(() => {
        const saved = localStorage.getItem('manual_country');
        return saved ? JSON.parse(saved) : null;
    });
    
    const [selectedCity, setSelectedCity] = useState(() => {
        const saved = localStorage.getItem('manual_city');
        return saved ? JSON.parse(saved) : null;
    });
    
    const [selectedDistrict, setSelectedDistrict] = useState(null);

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

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full h-[calc(100vh-140px)] min-h-[600px] overflow-visible lg:overflow-hidden pb-6">
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-auto lg:h-full max-h-[50vh] lg:max-h-none overflow-y-auto pr-2 scrollbar-thin">
                <ManualSidebar 
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                />
            </div>

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