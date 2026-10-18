import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { Input, FormGroup } from '@admin/core/ui/Input';
import { FaPlus, FaGlobeAmericas } from 'react-icons/fa';

export interface EntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string | React.ReactNode;
    placeholder?: string;
    isSubmitting?: boolean;
}

export default function EntityModal({ isOpen, onClose, onSubmit, title, placeholder, isSubmitting }: EntityModalProps) {
    const { t } = useTranslation('db');
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) onSubmit(inputValue.trim());
    };

    const modalTitle = (
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center text-xs">
                <FaGlobeAmericas />
            </div>
            <span className="text-sm font-bold text-textMain">{title}</span>
        </div>
    );

    const actions = (
        <>
            <Button variant="cancel" size="sm" onClick={onClose} disabled={isSubmitting}>
                {t('admin_manual.entity_modal.cancel_btn')}
            </Button>
            <Button type="submit" form="entityForm" variant="primary" size="sm" disabled={!inputValue.trim() || isSubmitting}>
                {isSubmitting ? t('admin_manual.entity_modal.processing') : <><FaPlus className="text-xs" /> {t('admin_manual.entity_modal.create_btn')}</>}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="420px" actions={actions}>
            <form id="entityForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormGroup label={t('admin_manual.entity_modal.name_label')} className="mb-0">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder || t('admin_manual.entity_modal.placeholder')}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 text-xs sm:text-sm font-medium"
                    />
                </FormGroup>
                <div className="flex items-start gap-2.5 text-textMuted bg-main/60 p-3 rounded-2xl border border-border/80">
                    <FaGlobeAmericas className="mt-0.5 text-primary shrink-0 opacity-80" />
                    <p className="text-[11px] leading-relaxed m-0 font-medium">
                        {t('admin.ui.entity_modal.hint')}
                    </p>
                </div>
            </form>
        </BaseModal>
    );
}