import React, { useState, useEffect } from 'react';
import ManualSidebar from './ManualSidebar';
import ManualEditor from './ManualEditor';
import styles from './ManualTab.module.css';

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
        <div className={styles.mainLayout}>
            <div className={styles.leftPanel}>
                <ManualSidebar 
                    selectedCountry={selectedCountry}
                    setSelectedCountry={setSelectedCountry}
                    selectedCity={selectedCity}
                    setSelectedCity={setSelectedCity}
                    selectedDistrict={selectedDistrict}
                    setSelectedDistrict={setSelectedDistrict}
                />
            </div>

            <div className={styles.rightPanel}>
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