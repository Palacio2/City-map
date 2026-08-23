import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { FaLayerGroup, FaCheck } from 'react-icons/fa';
import { ADMIN_PERMISSIONS_CONFIG } from '@admin/core/config/adminRoles';
import { AdminUser } from '@admin/core/types/admin.types';

interface AdminTabsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedAdmin: AdminUser | null;
    adminTabs: string[];
    toggleTabSelection: (key: string) => void;
    saveTabAssignments: () => void;
    processingId: string | null;
    t: (key: string, options?: Record<string, unknown>) => string;
}

export default function AdminTabsModal({
    isOpen,
    onClose,
    selectedAdmin,
    adminTabs,
    toggleTabSelection,
    saveTabAssignments,
    processingId,
    t
}: AdminTabsModalProps) {
    if (!isOpen || !selectedAdmin) return null;

    const modalTitle = (
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary-subtle text-primary border border-primary/20 flex items-center justify-center text-xs">
                <FaLayerGroup />
            </div>
            <span className="text-sm font-bold text-textMain">
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
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="600px" actions={modalActions}>
            <div className="flex flex-col gap-4">
                <div className="bg-main/50 px-3.5 py-2.5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] text-xs text-textMuted flex items-center justify-between shadow-2xs">
                    <span className="font-medium">{t('admin_users.tabs_modal.access_settings')}</span>
                    <span className="font-mono text-primary font-bold bg-primary-subtle px-2.5 py-0.5 rounded-md border border-primary/20">
                        {selectedAdmin.email}
                    </span>
                </div>

                <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-1 scrollbar-thin">
                    {ADMIN_PERMISSIONS_CONFIG.map((group, groupIdx) => (
                        <div key={groupIdx} className="flex flex-col gap-2 bg-main/30 p-3 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37]">
                            <h4 className="text-[10px] font-extrabold text-textMuted uppercase tracking-wider px-1">
                                {t(group.titleKey)}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {group.permissions.map(tab => {
                                    const isSelected = adminTabs.includes(tab.id);
                                    
                                    return (
                                        <div
                                            key={tab.id}
                                            className={`flex flex-col rounded-xl border transition-all overflow-hidden ${
                                                isSelected 
                                                    ? 'bg-primary-subtle border-primary/30 shadow-2xs' 
                                                    : 'bg-surface border-[#d6ccbf] dark:border-[#4a3f37] hover:bg-hover'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleTabSelection(tab.id)}
                                                className="flex items-start gap-2.5 p-3 w-full text-left cursor-pointer"
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-textMain'}`}>
                                                            {t(tab.translationKey)}
                                                        </span>
                                                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[8px] shrink-0 transition-colors ${
                                                            isSelected ? 'bg-primary border-primary text-white' : 'bg-main border-[#d6ccbf] dark:border-[#4a3f37] text-transparent'
                                                        }`}>
                                                            <FaCheck />
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-medium mt-1 leading-snug ${isSelected ? 'text-primary/80' : 'text-textMuted'}`}>
                                                        {t(tab.descriptionKey)}
                                                    </span>
                                                </div>
                                            </button>
                                            
                                            {isSelected && tab.actions && tab.actions.length > 0 && (
                                                <div className="px-3 pb-3 pt-1.5 border-t border-primary/15 bg-primary-subtle/40 flex flex-col gap-2">
                                                    {tab.actions.map(action => {
                                                        const isActionSelected = adminTabs.includes(action.id);
                                                        return (
                                                            <button 
                                                                key={action.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleTabSelection(action.id);
                                                                }}
                                                                className="flex items-center gap-2 text-left group cursor-pointer"
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[7px] shrink-0 transition-colors ${
                                                                    isActionSelected ? 'bg-primary border-primary text-white' : 'bg-surface border-[#d6ccbf] dark:border-[#4a3f37] text-transparent group-hover:border-primary/50'
                                                                }`}>
                                                                    <FaCheck />
                                                                </div>
                                                                <span className={`text-[11px] ${isActionSelected ? 'text-textMain font-bold' : 'text-textMuted'}`}>
                                                                    {t(action.translationKey)}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </BaseModal>
    );
}