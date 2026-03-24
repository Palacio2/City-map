import React, { useMemo } from 'react';
import { Select } from './Select';
import { Input } from './Input';

const FormGroup = ({ children, className = '' }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        {children}
    </div>
);

const Label = ({ children, className = '' }) => (
    <label className={`text-[0.9rem] font-bold text-textMuted flex items-center gap-2 ${className}`}>
        {children}
    </label>
);

export const DynamicFormRenderer = ({ fieldsConfig, formData, onChange, readOnly = false }) => {
    const groupedFields = useMemo(() => {
        return fieldsConfig.reduce((acc, field) => {
            if (!field.is_visible_form) return acc;
            const groupName = field.ui_group || 'Загальні';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(field);
            return acc;
        }, {});
    }, [fieldsConfig]);

    const handleChange = (code, type, value) => {
        if (readOnly) return;
        let parsedValue = value;
        if (type === 'integer') parsedValue = value === '' ? null : parseInt(value, 10);
        if (type === 'numeric') parsedValue = value === '' ? null : parseFloat(value);
        if (type === 'boolean') parsedValue = value === 'true';
        onChange(code, parsedValue);
    };

    return (
        <div className="dynamic-form flex flex-col gap-6">
            {Object.entries(groupedFields).map(([group, fields]) => (
                <div key={group} className="form-group bg-surface p-5 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
                    <h3 className="text-[1rem] font-extrabold mb-4 text-textMain tracking-tight flex items-center gap-2">
                        {group}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {fields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((field) => (
                            <FormGroup key={field.id || field.key}>
                                <Label>
                                    {field.icon && <span className="opacity-80 text-[1.1rem]">{field.icon}</span>}
                                    {field.label}
                                </Label>
                                
                                {field.ui_component === 'select' || field.type === 'boolean' ? (
                                    <Select 
                                        disabled={readOnly}
                                        value={formData[field.key] !== null && formData[field.key] !== undefined ? String(formData[field.key]) : ''} 
                                        onChange={(e) => handleChange(field.key, field.type, e.target.value)}
                                        className="w-full !px-3 !py-2 !text-[0.9rem]"
                                    >
                                        <option value="">-</option>
                                        <option value="true">Так</option>
                                        <option value="false">Ні</option>
                                    </Select>
                                ) : field.ui_component === 'textarea' ? (
                                    <textarea
                                        disabled={readOnly}
                                        className="w-full bg-main border border-border rounded-md px-3 py-2 text-[0.9rem] text-textMain outline-none focus:border-primary resize-y min-h-[100px]"
                                        value={formData[field.key] ?? ''}
                                        onChange={(e) => handleChange(field.key, field.type, e.target.value)}
                                    />
                                ) : (
                                    <Input 
                                        disabled={readOnly}
                                        type={field.type === 'text' ? 'text' : 'number'}
                                        step={field.type === 'numeric' ? '0.01' : '1'}
                                        className="w-full !px-3 !py-2 !text-[0.9rem]"
                                        value={formData[field.key] ?? ''}
                                        onChange={(e) => handleChange(field.key, field.type, e.target.value)}
                                        placeholder={`Введіть ${(field.label || '').toLowerCase()}`}
                                    />
                                )}
                            </FormGroup>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};