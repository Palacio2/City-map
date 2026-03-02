import React, { useState } from 'react';
import ManualSidebar from './ManualSidebar';
import ManualEditor from './ManualEditor';
import styles from './ManualTab.module.css';

export default function ManualTab() {
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    return (
        <div className={styles.mainLayout}>
            {/* Ліва колонка (Сайдбар) */}
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

            {/* Права колонка (Редактор) */}
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