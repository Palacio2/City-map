import { useEffect, useRef, useMemo } from 'react';
import { Button } from '@admin/core/ui/Button';
import { useTranslation } from 'react-i18next';
import { FaPlay, FaDownload, FaTrashAlt, FaTerminal } from 'react-icons/fa';
import { LogItem, ParserConsoleProps } from './types';

export default function ParserConsole({ logs = [], loading, onClear, onDownload, onStartClick, isStartDisabled, selectedCount = 0 }: ParserConsoleProps) {
    const { t } = useTranslation('db');
    const consoleRef = useRef<HTMLDivElement>(null);

    const displayLogs = useMemo(() => {
        return logs.slice(0, 500);
    }, [logs]);

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = 0;
        }
    }, [displayLogs]);

    return (
        <div className="bg-[#12100e] text-slate-200 rounded-b-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xl overflow-hidden flex flex-col h-[380px]">
            <div className="px-4 py-2.5 bg-surface/90 border-b border-[#d6ccbf] dark:border-[#4a3f37] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <FaTerminal className="text-primary text-xs" />
                    <span className="text-xs font-bold text-textMain tracking-tight">
                        {t('admin_parser.console.title')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClear}
                        disabled={logs.length === 0}
                        className="p-1.5 text-textMuted hover:text-textMain disabled:opacity-30 transition-colors rounded-lg text-xs flex items-center gap-1"
                        title={t('admin_parser.console.clear')}
                    >
                        <FaTrashAlt className="text-xs" />
                        <span className="hidden sm:inline">{t('admin_parser.console.clear')}</span>
                    </button>
                    <button
                        onClick={onDownload}
                        disabled={logs.length === 0}
                        className="p-1.5 text-textMuted hover:text-textMain disabled:opacity-30 transition-colors rounded-lg text-xs flex items-center gap-1"
                        title={t('admin_parser.console.download')}
                    >
                        <FaDownload className="text-xs" />
                        <span className="hidden sm:inline">{t('admin_parser.console.download_short')}</span>
                    </button>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={onStartClick}
                        disabled={isStartDisabled}
                    >
                        <FaPlay className="text-[10px]" />
                        <span>{t('admin_parser.console.start')} {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
                    </Button>
                </div>
            </div>

            <div
                ref={consoleRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin bg-[#12100e]"
            >
                {loading && (
                    <div className="flex items-center gap-2 text-emerald-400 mb-3 animate-pulse">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        <span>{t('admin_parser.console.parsing_in_progress')}</span>
                    </div>
                )}
                {displayLogs.length === 0 ? (
                    <div className="text-slate-500 italic h-full flex items-center justify-center text-xs">
                        {t('admin_parser.console.waiting_logs')}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {displayLogs.map((log: LogItem) => (
                            <div key={log.id} className="flex gap-3 hover:bg-slate-800/40 px-1.5 py-0.5 rounded transition-colors break-words">
                                {log.time && <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>}
                                <span className={
                                    log.type === 'error' ? 'text-rose-400 font-medium' :
                                    log.type === 'warning' ? 'text-amber-400' :
                                    log.msg.includes('Успішно') || log.msg.includes('Success') ? 'text-emerald-400 font-medium' :
                                    'text-slate-300'
                                }>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}