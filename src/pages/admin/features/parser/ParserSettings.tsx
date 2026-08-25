import { useMemo } from 'react';
import { getRegionsForCountry } from '@admin/core/utils/countryHelpers';
import { useTranslation } from 'react-i18next';
import { FormGroup, Input } from '@admin/core/ui/Input';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';
import { Button } from '@admin/core/ui/Button';
import { FaSyncAlt, FaFileCode, FaGlobe, FaCity, FaMapMarkedAlt } from 'react-icons/fa';
import { EntityItem, ParserSettingsProps } from './types';

export default function ParserSettings({
    country, setCountry,
    city, setCity,
    region, setRegion,
    countriesList, citiesList,
    onCountryChange,
    pbfFile, setPbfFile,
    availableFiles, loadAvailableFiles
}: ParserSettingsProps) {
    const { t } = useTranslation('db');
    const availableRegions = getRegionsForCountry(country?.name);

    const pbfOptions: SelectOption[] = useMemo(() => [
        { value: '', label: t('admin_parser.settings.select_pbf') },
        ...availableFiles.map((file: string) => ({
            value: file,
            label: file,
            icon: <FaFileCode className="text-primary text-xs" />
        }))
    ], [availableFiles, t]);

    const countryOptions: SelectOption[] = useMemo(() => [
        { value: '', label: t('admin_parser.settings.select_country') },
        ...countriesList.map((c: EntityItem) => ({
            value: c.id,
            label: c.name,
            icon: <FaGlobe className="text-textMuted text-xs" />
        }))
    ], [countriesList, t]);

    const cityOptions: SelectOption[] = useMemo(() => [
        { value: '', label: t('admin_parser.settings.select_city') },
        ...citiesList.map((c: EntityItem) => ({
            value: c.id,
            label: c.name,
            icon: <FaCity className="text-textMuted text-xs" />
        }))
    ], [citiesList, t]);

    const regionOptions: SelectOption[] = useMemo(() => [
        { value: '', label: t('admin_parser.settings.select_region') },
        ...availableRegions.map((r: string) => ({ value: r, label: r, icon: <FaMapMarkedAlt className="text-textMuted text-xs" /> }))
    ], [availableRegions, t]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <FormGroup label={t('admin_parser.settings.country')} className="mb-0">
                <CustomSelect
                    options={countryOptions}
                    value={country?.id || ''}
                    onChange={(val) => {
                        const c = countriesList.find((x: EntityItem) => x.id === val);
                        setCountry(c || null);
                        setCity(null);
                        setRegion('');
                        if (val) onCountryChange(String(val));
                    }}
                />
            </FormGroup>

            <FormGroup label={t('admin_parser.settings.city')} className="mb-0">
                <CustomSelect
                    options={cityOptions}
                    value={city?.id || ''}
                    disabled={!country}
                    onChange={(val) => {
                        const foundCity = citiesList.find((x: EntityItem) => x.id === val);
                        setCity(foundCity || null);
                    }}
                />
            </FormGroup>

            <FormGroup label={t('admin_parser.settings.region')} className="mb-0 md:col-span-2">
                {availableRegions.length > 0 ? (
                    <CustomSelect
                        options={regionOptions}
                        value={region}
                        onChange={(val) => setRegion(String(val))}
                        disabled={!city}
                    />
                ) : (
                    <Input
                        type="text"
                        value={region}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegion(e.target.value)}
                        placeholder={t('admin_parser.settings.manual_region')}
                        disabled={!city}
                        className="h-9 text-xs border-2"
                    />
                )}
            </FormGroup>

            <FormGroup label={t('admin_parser.settings.pbf_file')} className="mb-0 sm:col-span-3 md:col-span-4">
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        {availableFiles.length === 0 ? (
                            <div className="p-2 text-center text-textMuted bg-surface rounded-xl border border-dashed border-[#d6ccbf] dark:border-[#4a3f37] text-xs font-medium">
                                {t('admin_parser.tab.empty_folder')}
                            </div>
                        ) : (
                            <CustomSelect
                                options={pbfOptions}
                                value={pbfFile}
                                onChange={(val) => setPbfFile(String(val))}
                            />
                        )}
                    </div>
                    <Button variant="cancel" size="md" onClick={loadAvailableFiles} className="shrink-0 h-9 w-9 p-0 flex justify-center items-center rounded-xl" title={t('admin_parser.tab.refresh')}>
                        <FaSyncAlt className="text-xs text-textMuted" />
                    </Button>
                </div>
            </FormGroup>
        </div>
    );
}