import ParserSettings from '@admin/features/parser/ParserSettings';
import DistrictsManager from '@admin/features/parser/DistrictsManager';
import ParserParameters from '@admin/features/parser/ParserParameters';
import ParserConsole from '@admin/features/parser/ParserConsole';
import DistrictResultsGrid from '@admin/features/parser/DistrictResultsGrid';
import { Button } from '@admin/core/ui/Button';
import { FaCogs, FaGlobe, FaMapMarkedAlt, FaPlay, FaCheckCircle } from 'react-icons/fa';
import { useParserTab } from '@admin/features/parser/useParserTab';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { EntityItem, LogEntry, ParsedDistrictRowItem } from './types';

export default function ParserTab() {
    const tabLogic = useParserTab();
    const { canDo } = useActionGuard();

    const TABS = [
        { id: 1, label: tabLogic.t('admin_parser.tab.step1_title'), icon: <FaGlobe /> },
        { id: 2, label: tabLogic.t('admin_parser.tab.step2_title'), icon: <FaMapMarkedAlt /> },
        { id: 3, label: tabLogic.t('admin_parser.tab.step3_title'), icon: <FaCogs /> },
        { id: 4, label: tabLogic.t('admin_parser.steps.parsing_and_results'), icon: <FaPlay /> },
    ];

    const isTabDisabled = (id: number) => {
        if (id === 1) return false;
        if (id === 2) return !tabLogic.city || !tabLogic.pbfFile;
        if (id === 3 || id === 4) return tabLogic.selectedDistrictIds.length === 0;
        return true;
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fadeIn">
            {/* Header */}
            <div className="bg-surface p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] flex justify-between items-center shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <FaCogs className="text-xl" />
                    </div>
                    <div>
                        <h2 className="m-0 text-lg font-bold text-textMain">{tabLogic.t('admin_parser.tab.title')}</h2>
                        <p className="text-xs text-textMuted mt-1">{tabLogic.t('admin_parser.tab.subtitle')}</p>
                    </div>
                </div>
                <Button variant="danger" size="sm" onClick={tabLogic.handleResetAll}>
                    {tabLogic.t('admin_parser.tab.reset_all')}
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto scrollbar-hide pb-2 gap-2 border-b border-[#d6ccbf] dark:border-[#4a3f37]">
                {TABS.map((tab) => {
                    const disabled = isTabDisabled(tab.id);
                    const active = tabLogic.activeStep === tab.id;
                    const completed = tab.id < tabLogic.activeStep && !disabled;

                    return (
                        <button
                            key={tab.id}
                            disabled={disabled}
                            onClick={() => tabLogic.setActiveStep(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap relative ${
                                active
                                    ? 'bg-surface text-primary border-t border-l border-r border-[#d6ccbf] dark:border-[#4a3f37] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                                    : disabled
                                    ? 'text-textMuted/50 cursor-not-allowed opacity-50'
                                    : 'text-textMuted hover:text-textMain hover:bg-surface/50 border-t border-l border-r border-transparent'
                            }`}
                            style={{ marginBottom: active ? '-1px' : '0' }}
                        >
                            {completed && !active ? <FaCheckCircle className="text-success text-xs" /> : <span className={active ? 'text-primary' : ''}>{tab.icon}</span>}
                            {tab.label}
                            {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface z-10" style={{ marginBottom: '-1px' }}></div>}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Area */}
            <div className="min-h-[400px]">
                {tabLogic.activeStep === 1 && (
                    <div className="bg-surface p-5 rounded-b-2xl rounded-tr-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs mt-[-1px]">
                        <h3 className="m-0 text-base font-bold text-textMain mb-4 flex items-center gap-2">
                            <FaGlobe className="text-primary/70" /> {tabLogic.t('admin_parser.steps.location_selection')}
                        </h3>
                        <ParserSettings
                            country={tabLogic.country} setCountry={tabLogic.setCountry}
                            city={tabLogic.city} setCity={tabLogic.setCity}
                            region={tabLogic.region} setRegion={tabLogic.setRegion}
                            countriesList={tabLogic.logic.countries as unknown as EntityItem[]}
                            citiesList={tabLogic.allowedCities as unknown as EntityItem[]}
                            onCountryChange={tabLogic.logic.loadCities}
                            pbfFile={tabLogic.pbfFile} setPbfFile={tabLogic.setPbfFile}
                            availableFiles={tabLogic.logic.availableFiles} loadAvailableFiles={tabLogic.logic.loadAvailableFiles}
                        />
                        <div className="flex justify-end mt-6 pt-4 border-t border-[#d6ccbf]/50 dark:border-[#4a3f37]/50">
                            <Button variant="primary" onClick={() => tabLogic.setActiveStep(2)} disabled={isTabDisabled(2)}>
                                Далі: Райони
                            </Button>
                        </div>
                    </div>
                )}

                {tabLogic.activeStep === 2 && (
                    <div className="bg-surface p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs mt-[-1px]">
                        <h3 className="m-0 text-base font-bold text-textMain mb-4 flex items-center gap-2">
                            <FaMapMarkedAlt className="text-primary/70" /> {tabLogic.t('admin_parser.steps.districts_management')}
                        </h3>
                        <DistrictsManager
                            foundDistricts={tabLogic.logic.foundDistrictsOSM as (string | { name: string; [key: string]: unknown })[]}
                            dbDistricts={tabLogic.logic.dbDistricts as EntityItem[]}
                            selectedIds={tabLogic.selectedDistrictIds}
                            onToggleSelect={tabLogic.toggleDistrictSelection}
                            onSelectAll={tabLogic.toggleSelectAll}
                            onScan={() => tabLogic.logic.scanOSM(tabLogic.city?.name)}
                            onCreate={(districtsToCreate: unknown[]) => tabLogic.logic.createDistrictsInDb(districtsToCreate as Record<string, unknown>[], tabLogic.city.id)}
                            onRemoveFromFound={(d: unknown) => tabLogic.logic.setFoundDistrictsOSM((prev: unknown[]) => prev.filter(item => item !== d))}
                            onDeleteDbDistrict={(id: string) => tabLogic.logic.deleteDbDistrict(id, tabLogic.city.id)}
                            onImportGeoJson={(file: File) => tabLogic.logic.importBoundariesGeoJSON(file, tabLogic.city.id)}
                            loading={tabLogic.logic.loading}
                            isSuperAdmin={tabLogic.isSuperAdmin}
                        />
                        <div className="flex justify-between mt-6 pt-4 border-t border-[#d6ccbf]/50 dark:border-[#4a3f37]/50">
                            <Button variant="cancel" onClick={() => tabLogic.setActiveStep(1)}>{tabLogic.t('common.back')}</Button>
                            <Button variant="primary" onClick={() => tabLogic.setActiveStep(3)} disabled={isTabDisabled(3)}>
                                Далі: Налаштування
                            </Button>
                        </div>
                    </div>
                )}

                {tabLogic.activeStep === 3 && (
                    <div className="bg-surface p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs mt-[-1px]">
                        <h3 className="m-0 text-base font-bold text-textMain mb-4 flex items-center gap-2">
                            <FaCogs className="text-primary/70" /> {tabLogic.t('admin_parser.steps.source_settings')}
                        </h3>
                        <ParserParameters
                            onStart={(config: Record<string, unknown>) => {
                                tabLogic.setParserConfig(config);
                                tabLogic.handleStartParser(config);
                                tabLogic.setActiveStep(4);
                            }}
                            country={tabLogic.country} city={tabLogic.city} region={tabLogic.region}
                            selectedDistricts={(tabLogic.logic.dbDistricts as EntityItem[]).filter(d => tabLogic.selectedDistrictIds.includes(d.id))}
                        />
                    </div>
                )}

                {tabLogic.activeStep === 4 && (
                    <div className="flex flex-col gap-6 mt-[-1px]">
                        <div className="bg-surface p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs">
                            <h3 className="m-0 text-base font-bold text-textMain mb-4 flex items-center gap-2">
                                <FaPlay className="text-primary/70" /> {tabLogic.t('admin_parser.steps.execution')}
                            </h3>
                            <ParserConsole
                                logs={tabLogic.logic.logs as LogEntry[]}
                                loading={tabLogic.logic.loading}
                                onClear={tabLogic.logic.clearLogs}
                                onDownload={tabLogic.logic.downloadLogs}
                                onStartClick={() => tabLogic.handleStartParser(tabLogic.parserConfig)}
                                isStartDisabled={tabLogic.logic.loading || !tabLogic.city || tabLogic.selectedDistrictIds.length === 0 || !tabLogic.pbfFile || !canDo('parser.run_offline')}
                                selectedCount={tabLogic.selectedDistrictIds.length}
                            />
                        </div>

                        {tabLogic.processedParsedData && tabLogic.processedParsedData.length > 0 && (
                            <DistrictResultsGrid
                                data={tabLogic.processedParsedData as ParsedDistrictRowItem[]}
                                onSave={tabLogic.handleSave as unknown as (rows: unknown[]) => Promise<void>}
                                onRemove={tabLogic.logic.removeParsedItem}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}