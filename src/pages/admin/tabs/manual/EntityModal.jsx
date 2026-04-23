import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { Input, FormGroup } from '../../ui/Input';

export default function EntityModal({ isOpen, onClose, onSubmit, title, placeholder, isSubmitting }) {
    const { t } = useTranslation('db');
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) onSubmit(inputValue.trim());
    };

    const actions = (
        <>
            <Button variant="cancel" onClick={onClose} disabled={isSubmitting} className="!border-transparent">
                {t('admin_manual.entity_modal.cancel_btn')}
            </Button>
            <Button type="submit" form="entityForm" variant="primary" disabled={!inputValue.trim() || isSubmitting} className="shadow-md">
                {isSubmitting ? t('admin_manual.entity_modal.processing') : t('admin_manual.entity_modal.create_btn')}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="420px" actions={actions}>
            <form id="entityForm" onSubmit={handleSubmit} className="p-6">
                <FormGroup label={t('admin_manual.entity_modal.name_label')} className="mb-0">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isSubmitting}
                    />
                </FormGroup>
            </form>
        </BaseModal>
    );
}