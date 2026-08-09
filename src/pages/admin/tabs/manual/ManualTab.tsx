import { useState, useEffect } from 'react';
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
        <div className="flex flex-col lg:flex-row gap-5 w-full h-[calc(100vh-100px)] min-h-[600px]">
            <div className="w-full lg:w-80 shrink-0 flex flex-col h-auto lg:h-full overflow-y-auto pr-1 scrollbar-thin">
                <ManualSidebar
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
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