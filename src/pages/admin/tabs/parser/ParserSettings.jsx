import React from 'react';
import { getRegionsForCountry } from '../../utils/countryHelpers';
import { useTranslation } from 'react-i18next';
import { FormGroup, Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

const SelectGroup = React.memo(({ label, value, onChange, disabled, defaultOption, options }) => (
    <FormGroup label={label} className="mb-0">
        <Select value={value || ''} onChange={onChange} disabled={disabled}>
            <option value="">{defaultOption}</option>
            {options.map(opt => (
                <option key={opt.id || opt} value={opt.id || opt}>
                    {opt.name || opt}
                </option>
            ))}
        </Select>
    </FormGroup>
));

const ParserSettings = ({ country, setCountry, city, setCity, region, setRegion, countriesList, citiesList, onCountryChange }) => {
    const { t } = useTranslation('adminParser');
    const availableRegions = getRegionsForCountry(country?.name);

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 h-full content-start">
            <SelectGroup 
                label={t('parserSettings.country')}
                value={country?.id}
                defaultOption={t('parserSettings.selectCountry')}
                options={countriesList}
                onChange={(e) => {
                    const c = countriesList.find(x => x.id === e.target.value);
                    setCountry(c); setCity(null); setRegion('');
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

            <FormGroup label={t('parserSettings.region')} className="mb-0">
                {availableRegions.length > 0 ? (
                    <Select value={region} onChange={e => setRegion(e.target.value)}>
                        <option value="">{t('parserSettings.selectRegion')}</option>
                        {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                ) : (
                    <Input 
                        type="text" 
                        value={region} 
                        onChange={e => setRegion(e.target.value)} 
                        placeholder={t('parserSettings.manualRegion')} 
                        className="shadow-sm"
                    />
                )}
            </FormGroup>
        </div>
    );
};

export default React.memo(ParserSettings);