import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';
import { FaPlus, FaGlobeAmericas } from 'react-icons/fa';

export default function EntityModal({ isOpen, onClose, onSubmit, title, placeholder, isSubmitting }: any) {
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
            <div className="w-6 h-6 rounded bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center text-xs">
                <FaGlobeAmericas />
            </div>
            <span className="text-sm font-semibold text-textMain">{title}</span>
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
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="400px" actions={actions}>
            <form id="entityForm" onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                <FormGroup label={t('admin_manual.entity_modal.name_label')} className="mb-0">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder || t('admin_manual.entity_modal.placeholder')}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 text-xs bg-main border border-border focus:border-primary focus:bg-surface font-medium px-3 rounded-lg transition-colors"
                    />
                </FormGroup>
            </form>
        </BaseModal>
    );
}