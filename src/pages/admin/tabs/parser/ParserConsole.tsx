import { useEffect, useRef, useMemo } from 'react';
import { Button } from '../../ui/Button';
import { useTranslation } from 'react-i18next';
import { FaPlay, FaDownload, FaTrashAlt, FaTerminal } from 'react-icons/fa';

export default function ParserConsole({ logs = [], loading, onClear, onDownload, onStartClick, isStartDisabled, selectedCount }: any) {
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
        <div className="bg-[#090d16] text-slate-200 rounded-b-xl border border-border shadow-dropdown overflow-hidden flex flex-col h-[400px]">
            {/* Верхня панель терміналу */}
            <div className="px-4 py-2.5 bg-main/80 border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <FaTerminal className="text-primary text-xs" />
                    <span className="text-xs font-semibold text-textMain tracking-tight">
                        {t('admin_parser.console.title', 'Консоль виконання парсера')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onClear}
                        disabled={logs.length === 0}
                        className="p-1.5 text-textMuted hover:text-textMain disabled:opacity-30 transition-colors rounded text-xs flex items-center gap-1"
                        title={t('admin_parser.console.clear', 'Очистити')}
                    >
                        <FaTrashAlt className="text-xs" />
                        <span className="hidden sm:inline">{t('admin_parser.console.clear', 'Очистити')}</span>
                    </button>

                    <button
                        onClick={onDownload}
                        disabled={logs.length === 0}
                        className="p-1.5 text-textMuted hover:text-textMain disabled:opacity-30 transition-colors rounded text-xs flex items-center gap-1"
                        title={t('admin_parser.console.download', 'Завантажити лог')}
                    >
                        <FaDownload className="text-xs" />
                        <span className="hidden sm:inline">{t('admin_parser.console.download', 'Лог')}</span>
                    </button>

                    <Button
                        variant="success"
                        size="sm"
                        onClick={onStartClick}
                        disabled={isStartDisabled}
                    >
                        <FaPlay className="text-[10px]" /> 
                        <span>{t('admin_parser.console.start', 'Запуск')} {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
                    </Button>
                </div>
            </div>

            {/* Вміст логів */}
            <div
                ref={consoleRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin bg-[#090d16]"
            >
                {loading && (
                    <div className="flex items-center gap-2 text-emerald-400 mb-3 animate-pulse">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        <span>{t('admin_parser.console.parsing_in_progress', 'Триває процес парсингу об\'єктів...')}</span>
                    </div>
                )}

                {displayLogs.length === 0 ? (
                    <div className="text-slate-500 italic h-full flex items-center justify-center text-xs">
                        {t('admin_parser.console.waiting_logs', 'Очікування запуску парсера...')}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {displayLogs.map((log: any) => (
                            <div key={log.id} className="flex gap-3 hover:bg-slate-800/40 px-1.5 py-0.5 rounded transition-colors break-words">
                                {log.time && <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>}
                                <span className={
                                    log.type === 'error' ? 'text-red-400 font-medium' :
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