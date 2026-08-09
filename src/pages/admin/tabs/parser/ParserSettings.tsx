import { useMemo } from 'react';
import { getRegionsForCountry } from '../../utils/countryHelpers';
import { useTranslation } from 'react-i18next';
import { FormGroup, Input } from '../../ui/Input';
import { CustomSelect, SelectOption } from '../../ui/CustomSelect';
import { Button } from '../../ui/Button';
import { FaSyncAlt, FaFileCode, FaGlobe, FaCity, FaMapMarkedAlt } from 'react-icons/fa';

export default function ParserSettings({
    country, setCountry,
    city, setCity,
    region, setRegion,
    countriesList, citiesList,
    onCountryChange,
    pbfFile, setPbfFile,
    availableFiles, loadAvailableFiles
}: any) {
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
        ...countriesList.map((c: any) => ({
            value: c.id,
            label: c.name,
            icon: <FaGlobe className="text-textMuted text-xs" />
        }))
    ], [countriesList, t]);

    const cityOptions: SelectOption[] = useMemo(() => [
        { value: '', label: t('admin_parser.settings.select_city') },
        ...citiesList.map((c: any) => ({
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
        <div className="flex flex-col gap-4">
            <div className="bg-main/60 p-3.5 rounded-xl border border-border flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                    <FormGroup label={t('admin_parser.settings.pbf_file')} className="mb-0">
                        {availableFiles.length === 0 ? (
                            <div className="p-2 text-center text-textMuted bg-surface rounded-lg border border-dashed border-border text-xs">
                                {t('admin_parser.tab.empty_folder')}
                            </div>
                        ) : (
                            <CustomSelect
                                options={pbfOptions}
                                value={pbfFile}
                                onChange={(val) => setPbfFile(val)}
                            />
                        )}
                    </FormGroup>
                </div>

                <Button variant="cancel" size="md" onClick={loadAvailableFiles} className="shrink-0 h-9">
                    <FaSyncAlt className="text-xs" /> {t('admin_parser.tab.refresh')}
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormGroup label={t('admin_parser.settings.country')} className="mb-0">
                    <CustomSelect
                        options={countryOptions}
                        value={country?.id || ''}
                        onChange={(val) => {
                            const c = countriesList.find((x: any) => x.id === val);
                            setCountry(c || null);
                            setCity(null);
                            setRegion('');
                            if (val) onCountryChange(val);
                        }}
                    />
                </FormGroup>

                <FormGroup label={t('admin_parser.settings.city')} className="mb-0">
                    <CustomSelect
                        options={cityOptions}
                        value={city?.id || ''}
                        disabled={!country}
                        onChange={(val) => {
                            const foundCity = citiesList.find((x: any) => x.id === val);
                            setCity(foundCity || null);
                        }}
                    />
                </FormGroup>

                <FormGroup label={t('admin_parser.settings.region')} className="mb-0">
                    {availableRegions.length > 0 ? (
                        <CustomSelect
                            options={regionOptions}
                            value={region}
                            onChange={(val) => setRegion(val)}
                            disabled={!city}
                        />
                    ) : (
                        <Input
                            type="text"
                            value={region}
                            onChange={(e: any) => setRegion(e.target.value)}
                            placeholder={t('admin_parser.settings.manual_region')}
                            disabled={!city}
                            className="h-9 text-xs bg-surface border-border focus:border-primary"
                        />
                    )}
                </FormGroup>
            </div>
        </div>
    );
}