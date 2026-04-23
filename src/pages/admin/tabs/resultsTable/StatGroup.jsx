import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';

const StatGroup = ({ label, icon, fields, data, onChange, bgColor }) => {
    const { t } = useTranslation('db');

    return (
        <div className="bg-surface rounded-xl p-4 border border-border flex flex-col gap-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30" style={bgColor ? { background: bgColor } : {}}>
            <div className="text-[0.95rem] font-extrabold text-textMain flex items-center gap-2.5 mb-1 tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-main border border-border/50 flex items-center justify-center text-[1.1rem] shadow-inner shrink-0">
                    {icon}
                </div>
                {label}
            </div>
            <div className="flex flex-col gap-2">
                {fields.map(f => {
                    const val = data[f.key];
                    const isMissing = val === null || val === '' || val === undefined; 
                    const inputClass = `!px-2 !py-1 !w-[80px] !text-center !text-[0.85rem] !h-[30px] !min-h-0 font-bold font-mono text-primary`;

                    return (
                        <div key={f.key} className="flex justify-between items-center text-[0.8rem] font-bold text-textMuted gap-3 p-1.5 hover:bg-main/50 rounded-md transition-colors">
                            <span className="flex items-center gap-1.5 truncate">{f.label}</span>
                            {f.type === 'boolean' ? (
                                <Select
                                    className={`${inputClass} !text-textMain`}
                                    value={isMissing ? '' : String(val)}
                                    onChange={(e) => onChange(f.key, e.target.value === '' ? null : e.target.value === 'true')}
                                >
                                    <option value="">-</option>
                                    <option value="true">{t('admin_parser.table.yes')}</option>
                                    <option value="false">{t('admin_parser.table.no')}</option>
                                </Select>
                            ) : (
                                <Input
                                    type={f.type === 'text' ? 'text' : 'number'}
                                    className={inputClass}
                                    value={isMissing ? '' : val}
                                    onChange={(e) => {
                                        if (f.type === 'text') {
                                            onChange(f.key, e.target.value);
                                        } else {
                                            const rawVal = e.target.value;
                                            const newVal = f.type === 'float' ? parseFloat(rawVal) : parseInt(rawVal, 10);
                                            onChange(f.key, rawVal === '' ? '' : (isNaN(newVal) ? 0 : newVal));
                                        }
                                    }}
                                    placeholder="0"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(StatGroup);