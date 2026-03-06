import React from 'react';
import styles from './ParserSettings.module.css';
import { getRegionsForCountry } from '../../utils/countryHelpers';
import { useTranslation } from 'react-i18next';

export default function ParserSettings({ 
    country, setCountry, 
    city, setCity, 
    region, setRegion, 
    countriesList, citiesList, 
    onCountryChange 
}) {
    const { t } = useTranslation('admin');
    const availableRegions = getRegionsForCountry(country?.name);

    return (
        <div className={styles.settingsGrid}>
            <div className={styles.inputGroup}>
                <label>{t('parserSettings.country')}</label>
                <select 
                    className={styles.textInput} 
                    value={country?.id || ''} 
                    onChange={(e) => {
                        const c = countriesList.find(x => x.id === e.target.value);
                        setCountry(c);
                        setCity(null);
                        setRegion('');
                        if (c) onCountryChange(c.id);
                    }}
                >
                    <option value="">{t('parserSettings.selectCountry')}</option>
                    {countriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className={styles.inputGroup}>
                <label>{t('parserSettings.city')}</label>
                <select 
                    className={styles.textInput} 
                    value={city?.id || ''} 
                    onChange={(e) => {
                        const c = citiesList.find(x => x.id === e.target.value);
                        setCity(c);
                    }}
                    disabled={!country}
                >
                    <option value="">{t('parserSettings.selectCity')}</option>
                    {citiesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className={styles.inputGroup}>
                <label>{t('parserSettings.region')}</label>
                {availableRegions.length > 0 ? (
                    <select 
                        className={styles.textInput} 
                        value={region} 
                        onChange={e => setRegion(e.target.value)}
                    >
                        <option value="">{t('parserSettings.selectRegion')}</option>
                        {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                ) : (
                    <input 
                        type="text" 
                        className={styles.textInput} 
                        value={region} 
                        onChange={e => setRegion(e.target.value)} 
                        placeholder={t('parserSettings.manualRegion')} 
                    />
                )}
            </div>
        </div>
    );
}