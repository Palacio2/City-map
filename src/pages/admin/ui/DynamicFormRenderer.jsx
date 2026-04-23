import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from './Select';
import { Input } from './Input';

const CompactFieldRenderer = React.memo(({ field, value, onChange, readOnly }) => {
    const { t } = useTranslation('db');

    const handleChange = useCallback((e) => {
        let parsedValue = e.target.value;
        if (field.type === 'integer') parsedValue = parsedValue === '' ? null : parseInt(parsedValue, 10);
        if (field.type === 'numeric') parsedValue = parsedValue === '' ? null : parseFloat(parsedValue);
        if (field.type === 'boolean') parsedValue = parsedValue === 'true';
        onChange(field.key, parsedValue);
    }, [field.key, field.type, onChange]);

    const isTextarea = field.ui_component === 'textarea';
    const isText = field.type === 'text' && !isTextarea;

    if (isTextarea || isText) {
        return (
            <div className="col-span-full bg-surface p-3 rounded-xl border border-border shadow-sm focus-within:border-primary/50 transition-colors">
                <label className="text-[0.7rem] uppercase tracking-wider font-extrabold text-textMuted flex items-center gap-2 mb-2">
                    {field.icon && <span className="text-[1rem]">{field.icon}</span>}
                    {field.label}
                </label>
                {isTextarea ? (
                    <textarea
                        disabled={readOnly}
                        className="w-full bg-main/50 border border-border/50 rounded-lg px-3 py-2 text-[0.85rem] text-textMain outline-none focus:border-primary focus:bg-main resize-y min-h-[80px] transition-colors"
                        value={value ?? ''}
                        onChange={handleChange}
                    />
                ) : (
                    <Input 
                        disabled={readOnly}
                        type="text"
                        className="!w-full !bg-main/50 !border-border/50 focus:!bg-main !px-3 !py-2 !text-[0.85rem]"
                        value={value ?? ''}
                        onChange={handleChange}
                        placeholder={t('common.placeholders.enter_field', { name: (field.label || '').toLowerCase() })}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="group flex items-center justify-between p-2 rounded-xl bg-surface border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
            <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                {field.icon && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-main border border-border/50 text-[1.1rem] shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        {field.icon}
                    </div>
                )}
                <div className="flex flex-col min-w-0">
                    <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-textMuted truncate" title={field.label}>
                        {field.label}
                    </span>
                </div>
            </div>
            
            <div className="shrink-0 ml-2">
                {field.ui_component === 'select' || field.type === 'boolean' ? (
                    <Select 
                        disabled={readOnly}
                        value={value !== null && value !== undefined ? String(value) : ''} 
                        onChange={handleChange}
                        className="!w-[75px] !px-2 !py-0 !h-[28px] !min-h-0 !text-[0.8rem] !bg-main !border-border/60 focus:!border-primary font-bold text-center rounded-md cursor-pointer"
                    >
                        <option value="">-</option>
                        <option value="true">{t('common.enums.yes')}</option>
                        <option value="false">{t('common.enums.no')}</option>
                    </Select>
                ) : (
                    <Input 
                        disabled={readOnly}
                        type="number"
                        step={field.type === 'numeric' ? '0.01' : '1'}
                        className="!w-[75px] !px-2 !py-0 !h-[28px] !min-h-0 !text-[0.85rem] !bg-main !border-border/60 focus:!border-primary focus:!bg-surface font-mono font-bold text-primary text-center rounded-md transition-colors shadow-inner"
                        value={value ?? ''}
                        onChange={handleChange}
                        placeholder="0"
                    />
                )}
            </div>
        </div>
    );
});

export const DynamicFormRenderer = React.memo(({ fieldsConfig, formData, onChange, readOnly = false }) => {
    const { t } = useTranslation('db');

    const groupedFields = useMemo(() => {
        return fieldsConfig.reduce((acc, field) => {
            if (!field.is_visible_form) return acc;
            const groupName = field.ui_group || 'general';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(field);
            return acc;
        }, {});
    }, [fieldsConfig]);

    return (
        <div className="flex flex-col gap-6">
            {Object.entries(groupedFields).map(([group, fields]) => {
                const textFields = fields.filter(f => f.ui_component === 'textarea' || f.type === 'text');
                const compactFields = fields.filter(f => f.ui_component !== 'textarea' && f.type !== 'text');
                
                // Назва групи тепер береться з перекладів
                const groupDisplayName = t(`common.categories.${group}`, { defaultValue: group });

                return (
                    <div key={group} className="flex flex-col">
                        <div className="flex items-center gap-3 mb-3 pl-1">
                            <div className="px-3 py-1 rounded-md bg-main text-textMain text-[0.7rem] font-bold uppercase tracking-wider border border-border shadow-sm">
                                {groupDisplayName}
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-border/80 to-transparent"></div>
                        </div>
                        
                        {compactFields.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {compactFields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((field) => (
                                    <CompactFieldRenderer 
                                        key={field.id || field.key} 
                                        field={field} 
                                        value={formData[field.key]} 
                                        onChange={onChange} 
                                        readOnly={readOnly} 
                                    />
                                ))}
                            </div>
                        )}

                        {textFields.length > 0 && (
                            <div className={`grid grid-cols-1 gap-3 ${compactFields.length > 0 ? 'mt-3' : ''}`}>
                                {textFields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((field) => (
                                    <CompactFieldRenderer 
                                        key={field.id || field.key} 
                                        field={field} 
                                        value={formData[field.key]} 
                                        onChange={onChange} 
                                        readOnly={readOnly} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});