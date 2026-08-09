import ParserSettings from './ParserSettings';
import DistrictsManager from './DistrictsManager';
import ParserParameters from './ParserParameters';
import ParserConsole from './ParserConsole';
import DistrictRow from '../resultsTable/DistrictRow';
import { Button } from '../../ui/Button';
import { useTranslation } from 'react-i18next';
import { FaCogs, FaCheck, FaLock, FaMapMarkedAlt, FaListUl, FaSlidersH, FaTerminal, FaChartBar } from 'react-icons/fa';
import { useParserTab } from '../../hooks/useParserTab';

const StepHeader = ({ step, title, icon, isActive, isCompleted, isLocked, onEdit }: any) => {
    const { t } = useTranslation('db');

    return (
        <div
            className={`flex items-center justify-between px-4 py-3 border-b border-border transition-colors ${
                isActive ? 'bg-primary-subtle/40' : isCompleted ? 'bg-success-subtle/20 cursor-pointer hover:bg-success-subtle/30' : 'bg-main/30'
            }`}
            onClick={isCompleted && !isActive ? onEdit : undefined}
        >
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 ${
                    isActive ? 'bg-primary text-white shadow-subtle' : isCompleted ? 'bg-success text-white' : 'bg-surface border border-border text-textMuted'
                }`}>
                    {isCompleted && !isActive ? <FaCheck className="text-[10px]" /> : step}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-textMuted'}`}>
                        {icon}
                    </span>
                    <h3 className={`m-0 text-xs font-semibold tracking-tight ${isLocked ? 'text-textMuted' : 'text-textMain'}`}>
                        {title}
                    </h3>
                </div>
            </div>

            {isCompleted && !isActive && (
                <span className="text-[11px] font-medium text-primary hover:underline cursor-pointer">
                    {t('common.edit')}
                </span>
            )}
            {isLocked && (
                <FaLock className="text-textMuted/40 text-xs" />
            )}
        </div>
    );
};

export default function ParserTab() {
    const tabLogic = useParserTab();
    const { activeStep, setActiveStep } = tabLogic;

    return (
        <div className="flex flex-col gap-5 w-full">
            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-main text-primary rounded-lg border border-border flex items-center justify-center text-sm">
                        <FaCogs />
                    </div>
                    <div>
                        <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                            {tabLogic.t('admin_parser.tab.title')}
                        </h2>
                        <p className="m-0 text-textMuted text-xs mt-0.5">
                            {tabLogic.t('admin_parser.tab.subtitle')}
                        </p>
                    </div>
                </div>

                <Button variant="danger" size="sm" onClick={tabLogic.handleResetAll}>
                    {tabLogic.t('admin_parser.tab.reset_all')}
                </Button>
            </div>

            <div className="flex flex-col gap-4">
                <div className={`bg-surface rounded-xl border shadow-subtle overflow-hidden transition-all ${
                    activeStep === 1 ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                }`}>
                    <StepHeader
                        step={1}
                        title={tabLogic.t('admin_parser.tab.step1_title')}
                        icon={<FaMapMarkedAlt />}
                        isActive={activeStep === 1}
                        isCompleted={activeStep > 1}
                        isLocked={false}
                        onEdit={() => setActiveStep(1)}
                    />
                    {activeStep === 1 && (
                        <div className="p-4 flex flex-col gap-4">
                            <ParserSettings
                                country={tabLogic.country} setCountry={tabLogic.setCountry}
                                city={tabLogic.city} setCity={tabLogic.setCity}
                                region={tabLogic.region} setRegion={tabLogic.setRegion}
                                countriesList={tabLogic.logic.countries} citiesList={tabLogic.allowedCities}
                                onCountryChange={tabLogic.logic.loadCities}
                                pbfFile={tabLogic.pbfFile} setPbfFile={tabLogic.setPbfFile}
                                availableFiles={tabLogic.logic.availableFiles} loadAvailableFiles={tabLogic.logic.loadAvailableFiles}
                            />
                            <div className="flex justify-end pt-2">
                                <Button variant="primary" size="sm" disabled={!tabLogic.city || !tabLogic.pbfFile} onClick={() => setActiveStep(2)}>
                                    {tabLogic.t('common.next')} →
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`bg-surface rounded-xl border shadow-subtle overflow-hidden transition-all ${
                    activeStep === 2 ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                } ${activeStep < 2 ? 'opacity-60' : ''}`}>
                    <StepHeader
                        step={2}
                        title={tabLogic.t('admin_parser.tab.step2_title')}
                        icon={<FaListUl />}
                        isActive={activeStep === 2}
                        isCompleted={activeStep > 2}
                        isLocked={activeStep < 2}
                        onEdit={() => setActiveStep(2)}
                    />
                    {activeStep === 2 && (
                        <div className="flex flex-col">
                            <DistrictsManager
                                foundDistricts={tabLogic.logic.foundDistrictsOSM} dbDistricts={tabLogic.logic.dbDistricts}
                                selectedIds={tabLogic.selectedDistrictIds} onToggleSelect={tabLogic.toggleDistrictSelection} onSelectAll={tabLogic.toggleSelectAll}
                                onScan={() => tabLogic.logic.scanOSM(tabLogic.city?.name)} onCreate={(districtsToCreate: any) => tabLogic.logic.createDistrictsInDb(districtsToCreate, tabLogic.city.id)}
                                onRemoveFromFound={(d: any) => tabLogic.logic.setFoundDistrictsOSM((prev: any[]) => prev.filter((item: any) => item !== d))}
                                onDeleteDbDistrict={(id: string) => tabLogic.logic.deleteDbDistrict(id, tabLogic.city.id)}
                                onImportGeoJson={(file: File) => tabLogic.logic.importBoundariesGeoJSON(file, tabLogic.city.id)}
                                loading={tabLogic.logic.loading}
                                isSuperAdmin={tabLogic.isSuperAdmin}
                            />
                            <div className="p-3 bg-surface border-t border-border flex justify-end">
                                <Button variant="primary" size="sm" disabled={tabLogic.selectedDistrictIds.length === 0} onClick={() => setActiveStep(3)}>
                                    {tabLogic.t('common.next')} →
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`bg-surface rounded-xl border shadow-subtle overflow-hidden transition-all ${
                    activeStep === 3 ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                } ${activeStep < 3 ? 'opacity-60' : ''}`}>
                    <StepHeader
                        step={3}
                        title={tabLogic.t('admin_parser.tab.step3_title')}
                        icon={<FaSlidersH />}
                        isActive={activeStep === 3}
                        isCompleted={activeStep > 3}
                        isLocked={activeStep < 3}
                        onEdit={() => setActiveStep(3)}
                    />
                    {activeStep === 3 && (
                        <ParserParameters
                            onConfirm={(config: any) => { tabLogic.setParserConfig(config); setActiveStep(4); }}
                            onStart={(config: any) => tabLogic.handleStartParser(config)}
                            country={tabLogic.country} city={tabLogic.city} region={tabLogic.region}
                            selectedDistricts={tabLogic.logic.dbDistricts.filter((d: any) => tabLogic.selectedDistrictIds.includes(d.id))}
                        />
                    )}
                </div>

                <div className={`bg-surface rounded-xl border shadow-subtle overflow-hidden transition-all ${
                    activeStep === 4 ? 'border-primary ring-1 ring-primary/20' : 'border-border'
                } ${activeStep < 4 ? 'opacity-60' : ''}`}>
                    <StepHeader
                        step={4}
                        title={tabLogic.t('admin_parser.tab.step4_title')}
                        icon={<FaTerminal />}
                        isActive={activeStep === 4}
                        isCompleted={activeStep > 4}
                        isLocked={activeStep < 4}
                        onEdit={() => setActiveStep(4)}
                    />
                    {activeStep === 4 && (
                        <ParserConsole
                            logs={tabLogic.logic.logs} loading={tabLogic.logic.loading} onClear={tabLogic.logic.clearLogs}
                            onDownload={tabLogic.logic.downloadLogs} onStartClick={() => tabLogic.handleStartParser(tabLogic.parserConfig)}
                            isStartDisabled={tabLogic.logic.loading || !tabLogic.city || tabLogic.selectedDistrictIds.length === 0 || !tabLogic.pbfFile}
                            selectedCount={tabLogic.selectedDistrictIds.length}
                        />
                    )}
                </div>

                <div className={`bg-surface rounded-xl border shadow-subtle overflow-hidden transition-all ${
                    activeStep === 5 ? 'border-success ring-1 ring-success/20' : 'border-border'
                } ${activeStep < 5 ? 'opacity-60 hidden' : ''}`}>
                    <StepHeader
                        step={5}
                        title={tabLogic.t('admin_parser.tab.step5_title')}
                        icon={<FaChartBar />}
                        isActive={activeStep === 5}
                        isCompleted={false}
                        isLocked={activeStep < 5}
                        onEdit={() => {}}
                    />
                    {activeStep === 5 && tabLogic.processedParsedData.length > 0 && (
                        <div className="p-4 bg-surface flex flex-col gap-3">
                            {tabLogic.processedParsedData.map((row: any) => (
                                <DistrictRow
                                    key={row.district_id}
                                    row={row}
                                    onEdit={tabLogic.handleEditRow}
                                    onSave={tabLogic.handleSave}
                                    onRemove={tabLogic.logic.removeParsedItem}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}