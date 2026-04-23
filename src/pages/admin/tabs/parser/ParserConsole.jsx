import React, { useEffect, useRef, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { useTranslation } from 'react-i18next';
import { FaPlay, FaDownload, FaTrashAlt, FaTerminal } from 'react-icons/fa';

const ParserConsole = ({ logs = [], loading, onClear, onDownload, onStartClick, isStartDisabled, selectedCount }) => {
    const { t } = useTranslation('db');
    const consoleRef = useRef(null);

    const displayLogs = useMemo(() => {
        return logs.slice(0, 500);
    }, [logs]);

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = 0;
        }
    }, [displayLogs]);

    return (
        <div className="bg-[#0f172a] rounded-xl border border-[#1e293b] shadow-xl overflow-hidden flex flex-col h-[450px]">
            <div className="p-4 bg-[#1e293b] border-b border-[#334155] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[1rem]">4</span>
                    <h3 className="m-0 text-[1.1rem] text-slate-200 font-bold tracking-tight flex items-center gap-2">
                        <FaTerminal className="opacity-70" /> {t('admin_parser.console.title')}
                    </h3>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onClear} 
                        disabled={logs.length === 0}
                        className="bg-transparent text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-none cursor-pointer p-2 flex items-center gap-2 font-medium text-[0.85rem]"
                    >
                        <FaTrashAlt /> <span className="hidden sm:inline">{t('admin_parser.console.clear')}</span>
                    </button>
                    <button 
                        onClick={onDownload} 
                        disabled={logs.length === 0}
                        className="bg-transparent text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-none cursor-pointer p-2 flex items-center gap-2 font-medium text-[0.85rem]"
                    >
                        <FaDownload /> <span className="hidden sm:inline">{t('admin_parser.console.download')}</span>
                    </button>
                    
                    <div className="w-[1px] h-6 bg-[#334155] mx-1"></div>

                    <Button 
                        variant="success" 
                        onClick={onStartClick} 
                        disabled={isStartDisabled}
                        className="!py-2 !px-5 !bg-emerald-600 hover:!bg-emerald-500 !text-white !border-none"
                    >
                        <FaPlay /> {t('admin_parser.console.start')} {selectedCount > 0 ? `(${selectedCount})` : ''}
                    </Button>
                </div>
            </div>

            <div 
                ref={consoleRef}
                className="flex-1 p-5 overflow-y-auto font-mono text-[0.85rem] leading-relaxed scrollbar-thin bg-[#0f172a]"
            >
                {loading && (
                    <div className="flex items-center gap-3 text-emerald-400 mb-4 animate-pulse font-bold">
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                        {t('admin_parser.console.parsing_in_progress')}
                    </div>
                )}
                
                {displayLogs.length === 0 ? (
                    <div className="text-slate-500 italic h-full flex items-center justify-center opacity-70">
                        {t('admin_parser.console.waiting_logs')}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {displayLogs.map((log) => (
                            <div key={log.id} className="flex gap-4 hover:bg-[#1e293b]/50 px-2 py-0.5 rounded transition-colors break-words">
                                {log.time && <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>}
                                <span className={
                                    log.type === 'error' ? 'text-red-400 font-bold' : 
                                    log.type === 'warning' ? 'text-amber-400' : 
                                    log.msg.includes('Успішно') || log.msg.includes('Success') ? 'text-emerald-400 font-semibold' :
                                    'text-slate-300'
                                }>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                        {logs.length > 500 && (
                            <div className="text-slate-500 italic mt-4 text-center">
                                {t('admin_parser.console.showing_last')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ParserConsole);