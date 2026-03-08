import React from 'react';
import { getRegionsForCountry } from '../../utils/countryHelpers';
import { useTranslation } from 'react-i18next';
import uiStyles from '../../ui/AdminUI.module.css';

const SelectGroup = React.memo(({ label, value, onChange, disabled, defaultOption, options }) => (
    <div className={uiStyles.formGroup}>
        <label className={uiStyles.label}>{label}</label>
        <select className={uiStyles.input} value={value || ''} onChange={onChange} disabled={disabled}>
            <option value="">{defaultOption}</option>
            {options.map(opt => (
                <option key={opt.id || opt} value={opt.id || opt}>
                    {opt.name || opt}
                </option>
            ))}
        </select>
    </div>
));

const ParserSettings = ({ 
    country, setCountry, city, setCity, region, setRegion, 
    countriesList, citiesList, onCountryChange 
}) => {
    const { t } = useTranslation('admin');
    const availableRegions = getRegionsForCountry(country?.name);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <SelectGroup 
                label={t('parserSettings.country')}
                value={country?.id}
                defaultOption={t('parserSettings.selectCountry')}
                options={countriesList}
                onChange={(e) => {
                    const c = countriesList.find(x => x.id === e.target.value);
                    setCountry(c); 
                    setCity(null); 
                    setRegion('');
                    if (c) onCountryChange(c.id);
                }}
            />

            <SelectGroup 
                label={t('parserSettings.city')}
                value={city?.id}
                disabled={!country}
                defaultOption={t('parserSettings.selectCity')}
                options={citiesList}
                onChange={(e) => setCity(citiesList.find(x => x.id === e.target.value))}
            />

            <div className={uiStyles.formGroup}>
                <label className={uiStyles.label}>{t('parserSettings.region')}</label>
                {availableRegions.length > 0 ? (
                    <select className={uiStyles.input} value={region} onChange={e => setRegion(e.target.value)}>
                        <option value="">{t('parserSettings.selectRegion')}</option>
                        {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                ) : (
                    <input 
                        type="text" 
                        className={uiStyles.input} 
                        value={region} 
                        onChange={e => setRegion(e.target.value)} 
                        placeholder={t('parserSettings.manualRegion')} 
                    />
                )}
            </div>
        </div>
    );
};

export default React.memo(ParserSettings);