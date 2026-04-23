import React, { useState, useCallback, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaLock, FaSave, FaTimes, FaShieldAlt, FaChevronDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import { useMutation } from '@tanstack/react-query';
import { validateChangePasswordForm } from '@components/auth/validation';

const StatusMessage = React.memo(({ type, text }: { type: string; text: string }) => {
    if (!text) return null;
    const Icon = type === 'success' ? FaCheckCircle : FaTimesCircle;
    const isSuccess = type === 'success';
    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg font-medium text-[0.9rem] animate-slideDown ${isSuccess ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`} role="alert">
            <Icon className="shrink-0 text-lg" />
            <span>{text}</span>
        </div>
    );
});
StatusMessage.displayName = 'StatusMessage';

export default function PasswordChangePage() {
    const { t } = useTranslation('db');
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isTipsOpen, setIsTipsOpen] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });

    const handleInputChange = useCallback((field: 'newPassword' | 'confirmPassword', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (statusMessage.text) setStatusMessage({ type: '', text: '' });
    }, [statusMessage.text]);

    const togglePasswordVisibility = useCallback((field: 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const updatePasswordMutation = useMutation({
        mutationFn: async (password: string) => {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
        },
        onSuccess: () => {
            setStatusMessage({ type: 'success', text: t('profile.password_page.success') });
            setFormData({ newPassword: '', confirmPassword: '' });
            setTimeout(() => navigate('/profile'), 1500);
        },
        onError: (error: any) => {
            let msg = error.message;
            if (msg.includes("different from the old password") || msg.includes("same as the old password")) {
                msg = t('profile.errors.password_same_as_old');
            } else {
                msg = msg || t('profile.password_page.errors.unknown');
            }
            setStatusMessage({ type: 'error', text: msg });
        }
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatusMessage({ type: '', text: '' });

        const validationError = validateChangePasswordForm(formData, t);
        if (validationError) {
            setStatusMessage({ type: 'error', text: validationError });
            return;
        }

        updatePasswordMutation.mutate(formData.newPassword);
    };

    const securityTips = t('profile.password_page.tips', { returnObjects: true });
    const parsedTips: string[] = Array.isArray(securityTips) ? securityTips : (typeof securityTips === 'string' ? JSON.parse(securityTips) : []);
    const isSaving = updatePasswordMutation.isPending;

    return (
        <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body animate-fadeIn">
            <div className="max-w-[1200px] mx-auto mb-10 flex flex-col gap-4">
                <Link to="/profile" className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none">
                    <FaArrowLeft /> <span>{t('profile.actions.back_to_profile')}</span>
                </Link>
                <div className="mt-2">
                    <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold text-accent mb-2 inline-block">{t('profile.password_page.title')}</h1>
                    <p className="text-textSecondary text-base max-w-[600px] leading-relaxed">{t('profile.password_page.subtitle')}</p>
                </div>
            </div>

            <div className="max-w-[600px] mx-auto w-full">
                <div className="ui-glass-panel p-6 md:p-10 shadow-card">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8">
                        <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} />

                        <div className="text-center border-b border-borderClient pb-6 mb-2">
                            <h2 className="font-heading text-textMain text-2xl font-bold mb-2">{t('profile.password_page.form_title')}</h2>
                            <p className="text-textSecondary text-[0.9rem] m-0">{t('profile.password_page.form_subtitle')}</p>
                        </div>

                        <StatusMessage type={statusMessage.type} text={statusMessage.text} />
                        
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="newPassword" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-[0.03em]">
                                    <FaLock className="text-accent text-[0.9rem]" />
                                    {t('profile.password_page.new_pass')}
                                </label>
                                <div className="relative flex items-center w-full">
                                    <input
                                        id="newPassword" name="newPassword"
                                        type={showPasswords.new ? "text" : "password"}
                                        className="w-full p-4 pr-12 bg-body border border-borderClient rounded-lg text-textMain font-body text-base transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                        value={formData.newPassword}
                                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                        placeholder={t('profile.password_page.placeholders.new')}
                                        required disabled={isSaving} autoComplete="new-password"
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-textSecondary cursor-pointer p-2 flex items-center justify-center transition-all hover:text-textMain hover:scale-110" onClick={() => togglePasswordVisibility('new')}>
                                        {showPasswords.new ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="confirmPassword" className="flex items-center gap-2 font-semibold text-textMain text-[0.9rem] font-heading uppercase tracking-[0.03em]">
                                    <FaLock className="text-accent text-[0.9rem]" />
                                    {t('profile.password_page.confirm_pass')}
                                </label>
                                <div className="relative flex items-center w-full">
                                    <input
                                        id="confirmPassword" name="confirmPassword"
                                        type={showPasswords.confirm ? "text" : "password"}
                                        className="w-full p-4 pr-12 bg-body border border-borderClient rounded-lg text-textMain font-body text-base transition-all focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder={t('profile.password_page.placeholders.confirm')}
                                        required disabled={isSaving} autoComplete="new-password"
                                    />
                                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-textSecondary cursor-pointer p-2 flex items-center justify-center transition-all hover:text-textMain hover:scale-110" onClick={() => togglePasswordVisibility('confirm')}>
                                        {showPasswords.confirm ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mt-2">
                            <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2.5 p-4 bg-gradient-to-br from-accent to-accent-hover text-white border-none rounded-lg font-heading text-[0.9rem] font-bold uppercase tracking-widest cursor-pointer transition-all shadow-sm hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-md hover:not(:disabled):brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave className="text-lg" />}
                                {isSaving ? t('profile.actions.saving') : t('profile.actions.change_password')}
                            </button>

                            <Link to="/profile" className="flex-1 flex items-center justify-center gap-2.5 p-4 bg-transparent text-textMain border border-borderClient rounded-lg font-heading text-[0.9rem] font-bold uppercase tracking-widest cursor-pointer transition-all decoration-none hover:bg-hover hover:border-textSecondary">
                                <FaTimes className="text-lg" />
                                {t('profile.actions.cancel')}
                            </Link>
                        </div>

                        <div className="mt-4 bg-body rounded-xl border border-borderClient overflow-hidden transition-colors hover:border-accent">
                            <button type="button" className={`flex items-center justify-between p-5 cursor-pointer w-full bg-transparent border-b border-transparent text-textMain transition-all hover:bg-accent/5 ${isTipsOpen ? 'border-borderClient bg-accent/5' : ''}`} onClick={() => setIsTipsOpen(!isTipsOpen)}>
                                <span className="flex items-center gap-2.5 font-semibold font-heading text-[0.9rem] uppercase tracking-wide">
                                    <FaShieldAlt className="text-success text-lg"/>
                                    {t('profile.password_page.tips_title')}
                                </span>
                                <FaChevronDown className={`text-textSecondary transition-transform duration-[400ms] ${isTipsOpen ? 'rotate-180 text-accent' : ''}`} />
                            </button>
                            <div className={`grid transition-all duration-[400ms] ${isTipsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                <div className="overflow-hidden">
                                    <div className={`p-5 pt-2 transition-all duration-300 delay-100 ${isTipsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                        <ul className="m-0 pl-0 list-none flex flex-col gap-3">
                                            {parsedTips.map((tip, index) => (
                                                <li key={index} className="flex items-start gap-2.5 text-[0.9rem] text-textSecondary leading-relaxed">
                                                    <span className="text-accent font-bold mt-0.5">•</span>{tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}