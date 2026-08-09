import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { 
    FaLayerGroup, FaCheck, FaChartPie, FaMapMarkedAlt, 
    FaCloudDownloadAlt, FaEdit, FaComments, FaBrain 
} from 'react-icons/fa';

const AVAILABLE_TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: FaChartPie, desc: 'Огляд аналітики та методів' },
    { key: 'map', label: 'Map / Regions', icon: FaMapMarkedAlt, desc: 'Карта районів та POI' },
    { key: 'parser', label: 'Parser', icon: FaCloudDownloadAlt, desc: 'Автоматичний парсинг OSM/WAQI' },
    { key: 'manual', label: 'Manual Edit', icon: FaEdit, desc: 'Ручне редагування даних міст' },
    { key: 'comments', label: 'Comments', icon: FaComments, desc: 'Модерація коментарів' },
    { key: 'feedback', label: 'Feedback', icon: FaComments, desc: 'Відгуки та повідомлення' },
    { key: 'ai', label: 'AI Logs', icon: FaBrain, desc: 'Журнал взаємодій з штучним інтелектом' }
];

export default function AdminTabsModal({ isOpen, onClose, selectedAdmin, adminTabs, toggleTabSelection, saveTabAssignments, processingId, t }: any) {
    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <div className="flex items-center gap-2">
            <FaLayerGroup className="text-primary text-sm" />
            <span className="text-sm font-semibold text-textMain">
                {t('admin_users.tabs_modal.title')}
            </span>
        </div>
    );

    const isProcessing = processingId === selectedAdmin.id;
    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={onClose} disabled={isProcessing}>
                {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={saveTabAssignments} disabled={isProcessing}>
                {isProcessing ? t('common.saving') : t('common.save')}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="560px" actions={modalActions}>
            <div className="flex flex-col gap-4 p-4">
                
                <div className="bg-main/60 p-3 rounded-xl border border-border text-xs text-textMuted flex items-center justify-between">
                    <span>Налаштування доступу для:</span>
                    <span className="font-mono text-primary font-medium bg-primary-subtle px-2 py-0.5 rounded border border-primary/20">
                        {selectedAdmin.email}
                    </span>
                </div>

                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
                    {AVAILABLE_TABS.map(tab => {
                        const isSelected = adminTabs.includes(tab.key);
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => toggleTabSelection(tab.key)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                                    isSelected 
                                        ? 'bg-primary-subtle border-primary/30 text-primary shadow-2xs' 
                                        : 'bg-surface border-border hover:bg-hover text-textMain'
                                }`}
                            >
                                <div className={`p-2 rounded-lg border shrink-0 transition-colors ${
                                    isSelected ? 'bg-primary text-white border-primary' : 'bg-main border-border text-textMuted'
                                }`}>
                                    <Icon className="text-xs" />
                                </div>

                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-semibold truncate">{tab.label}</span>
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] shrink-0 ${
                                            isSelected ? 'bg-primary border-primary text-white' : 'bg-main border-border text-transparent'
                                        }`}>
                                            <FaCheck />
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-textMuted font-normal truncate mt-0.5">
                                        {tab.desc}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </BaseModal>
    );
}