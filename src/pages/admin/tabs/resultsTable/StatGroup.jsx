import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';

const StatGroup = ({ label, icon, fields, data, onChange, bgColor }) => {
    const { t } = useTranslation('adminResults');

    return (
        <div className="bg-surface rounded-xl p-5 border border-border flex flex-col gap-4 shadow-sm transition-all hover:shadow-md" style={bgColor ? { background: bgColor } : {}}>
            <div className="text-[1rem] font-extrabold text-textMain flex items-center gap-2.5 mb-1 tracking-tight">
                <span className="opacity-80 text-[1.1rem]">{icon}</span> {label}
            </div>
            <div className="flex flex-col gap-2.5">
                {fields.map(f => {
                    const val = data[f.key];
                    const isMissing = val === null || val === '' || val === undefined; 
                    const inputClass = `!px-3 !py-2 !w-[110px] !text-right !text-[0.9rem]`;

                    return (
                        <div key={f.key} className="flex justify-between items-center text-[0.85rem] font-medium text-textMuted gap-3">
                            <span className="flex items-center gap-1.5">{f.label}</span>
                            {f.type === 'boolean' ? (
                                <Select
                                    className={`${inputClass} !py-2 !px-3 !text-[0.9rem] !w-[110px]`}
                                    value={isMissing ? '' : (val ? 'true' : 'false')}
                                    onChange={e => {
                                        const v = e.target.value;
                                        onChange(f.key, v === '' ? null : v === 'true');
                                    }}
                                >
                                    <option value="">-</option>
                                    <option value="true">{t('resultsTable.yes')}</option>
                                    <option value="false">{t('resultsTable.no')}</option>
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