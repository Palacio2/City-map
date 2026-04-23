import React from 'react';
import { getRegionsForCountry } from '../../utils/countryHelpers';
import { useTranslation } from 'react-i18next';
import { FormGroup, Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

const SelectGroup = React.memo(({ label, value, onChange, disabled, defaultOption, options }) => (
    <FormGroup label={label} className="mb-0">
        <Select value={value || ''} onChange={onChange} disabled={disabled} className="!bg-surface">
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
    const { t } = useTranslation('db');
    const availableRegions = getRegionsForCountry(country?.name);

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 h-full content-start">
            <SelectGroup 
                label={t('admin_parser.settings.country')}
                value={country?.id}
                defaultOption={t('admin_parser.settings.select_country')}
                options={countriesList}
                onChange={(e) => {
                    const c = countriesList.find(x => x.id === e.target.value);
                    setCountry(c); setCity(null); setRegion('');
                    if (c) onCountryChange(c.id);
                }}
            />

            <SelectGroup 
                label={t('admin_parser.settings.city')}
                value={city?.id}
                disabled={!country}
                defaultOption={t('admin_parser.settings.select_city')}
                options={citiesList}
                onChange={(e) => setCity(citiesList.find(x => x.id === e.target.value))}
            />

            <FormGroup label={t('admin_parser.settings.region')} className="mb-0">
                {availableRegions.length > 0 ? (
                    <Select value={region} onChange={e => setRegion(e.target.value)} className="!bg-surface">
                        <option value="">{t('admin_parser.settings.select_region')}</option>
                        {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                ) : (
                    <Input 
                        type="text" 
                        value={region} 
                        onChange={e => setRegion(e.target.value)} 
                        placeholder={t('admin_parser.settings.manual_region')} 
                        className="!bg-surface shadow-sm"
                    />
                )}
            </FormGroup>
        </div>
    );
};

export default React.memo(ParserSettings);