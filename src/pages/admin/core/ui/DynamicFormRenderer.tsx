import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@admin/core/ui/Select';
import { Input } from '@admin/core/ui/Input';
import { DynamicFormRendererProps, FormattedFieldItem } from '@admin/core/types/ui.types';

const CompactFieldRenderer = React.memo(({ field, value, onChange, readOnly }: { field: FormattedFieldItem; value: unknown; onChange: (key: string, val: unknown) => void; readOnly?: boolean }) => {
    const { t } = useTranslation('db');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let parsedValue: unknown = e.target.value;
        if (field.type === 'integer') parsedValue = parsedValue === '' ? null : parseInt(parsedValue as string, 10);
        if (field.type === 'numeric') parsedValue = parsedValue === '' ? null : parseFloat(parsedValue as string);
        if (field.type === 'boolean') parsedValue = parsedValue === 'true';
        onChange(field.key, parsedValue);
    }, [field.key, field.type, onChange]);

    const isTextarea = field.ui_component === 'textarea';
    const isText = field.type === 'text' && !isTextarea;

    if (isTextarea || isText) {
        return (
            <div className="col-span-full bg-surface p-3 sm:p-3.5 rounded-xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-2xs hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                <label className="text-[10px] uppercase tracking-wider font-bold text-textMuted flex items-center gap-1.5 mb-1.5">
                    {field.icon && <span className="text-xs">{field.icon}</span>}
                    {field.label}
                </label>
                {isTextarea ? (
                    <textarea
                        disabled={readOnly}
                        className="w-full bg-main/30 dark:bg-main/50 border border-[#d6ccbf] dark:border-[#4a3f37] rounded-lg px-3 py-2 text-xs text-textMain outline-none focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15 resize-y min-h-[70px] transition-all shadow-2xs"
                        value={(value as string) ?? ''}
                        onChange={handleChange}
                    />
                ) : (
                    <Input
                        disabled={readOnly}
                        type="text"
                        value={(value as string) ?? ''}
                        onChange={handleChange}
                        className="!h-8 !text-xs !py-1 !px-2.5"
                        placeholder={t('common.placeholders.enter_field', { name: (field.label || '').toLowerCase() })}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="group flex flex-col justify-between p-2 sm:p-2.5 rounded-xl bg-surface border border-[#d6ccbf] dark:border-[#4a3f37] shadow-2xs hover:border-primary/60 transition-all gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
                {field.icon && (
                    <span className="text-xs shrink-0 select-none">
                        {field.icon}
                    </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-textMuted truncate" title={field.label}>
                    {field.label}
                </span>
            </div>

            <div className="w-full">
                {field.ui_component === 'select' || field.type === 'boolean' ? (
                    <Select
                        disabled={readOnly}
                        value={value !== null && value !== undefined ? String(value) : ''}
                        onChange={handleChange}
                        className="!h-7.5 !text-xs !py-0 !px-2 font-semibold !bg-main/30 dark:!bg-main/50 focus:!bg-surface !rounded-lg"
                    >
                        <option value="">-</option>
                        <option value="true">{t('common.enums.yes')}</option>
                        <option value="false">{t('common.enums.no')}</option>
                    </Select>
                ) : (
                    <input
                        disabled={readOnly}
                        type="number"
                        step={field.type === 'numeric' ? '0.01' : '1'}
                        min="0"
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        className="w-full h-7.5 px-2 rounded-lg border border-[#d6ccbf] dark:border-[#4a3f37] bg-main/30 dark:bg-main/50 text-textMain font-mono font-bold text-xs focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-textMuted/40 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                        value={(value as string | number) ?? ''}
                        onChange={handleChange}
                        placeholder="0"
                    />
                )}
            </div>
        </div>
    );
});

CompactFieldRenderer.displayName = 'CompactFieldRenderer';

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = React.memo(({ fieldsConfig, formData, onChange, readOnly = false }) => {
    const { t } = useTranslation('db');

    const groupedFields = useMemo(() => {
        return (fieldsConfig || []).reduce((acc: Record<string, FormattedFieldItem[]>, field: FormattedFieldItem) => {
            if (!field.is_visible_form) return acc;
            const groupName = field.ui_group || 'general';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(field);
            return acc;
        }, {});
    }, [fieldsConfig]);

    return (
        <div className="flex flex-col gap-4">
            {Object.entries(groupedFields).map(([group, fields]) => {
                const textFields = fields.filter((f: FormattedFieldItem) => f.ui_component === 'textarea' || f.type === 'text');
                const compactFields = fields.filter((f: FormattedFieldItem) => f.ui_component !== 'textarea' && f.type !== 'text');
                const groupDisplayName = t(`common.categories.${group}`, group);

                return (
                    <div key={group} className="flex flex-col">
                        <div className="flex items-center gap-2.5 mb-2 pl-0.5">
                            <span className="px-2.5 py-0.5 rounded-lg bg-primary-subtle text-primary border border-primary/25 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                                {groupDisplayName}
                            </span>
                            <div className="flex-1 h-px bg-gradient-to-r from-[#d6ccbf] dark:from-[#4a3f37] to-transparent"></div>
                        </div>

                        {compactFields.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {compactFields.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((field: FormattedFieldItem) => (
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
                            <div className={`grid grid-cols-1 gap-2 ${compactFields.length > 0 ? 'mt-2' : ''}`}>
                                {textFields.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((field: FormattedFieldItem) => (
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

DynamicFormRenderer.displayName = 'DynamicFormRenderer';