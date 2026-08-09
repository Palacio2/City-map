// @ts-nocheck
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { FaEnvelope, FaLock, FaShieldAlt, FaQrcode, FaMobileAlt } from 'react-icons/fa';

export default function Login() {
    const { t } = useTranslation('db');
    const [step, setStep] = useState('credentials'); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [factorId, setFactorId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: signInError } = await api.auth.signIn({ email, password });
            if (signInError) throw signInError;

            const userRole = data.user.app_metadata?.role;
            if (userRole !== 'admin' && userRole !== 'super_admin') {
                await api.auth.signOut();
                setError(t('admin_login.access_denied'));
                setLoading(false);
                return;
            }

            const { data: factorsData, error: factorsError } = await api.auth.mfa.listFactors();
            if (factorsError) throw factorsError;

            const totpFactors = factorsData.totp || [];
            const verifiedFactor = totpFactors.find(f => f.status === 'verified');
            const unverifiedFactors = totpFactors.filter(f => f.status === 'unverified');

            if (verifiedFactor) {
                setFactorId(verifiedFactor.id);
                setStep('mfa_verify');
            } else {
                for (const uf of unverifiedFactors) {
                    await api.auth.mfa.unenroll({ factorId: uf.id });
                }

                const safeFriendlyName = unverifiedFactors.length > 0 
                    ? `${email} (${t('admin_login.attempt')} ${unverifiedFactors.length + 1})` 
                    : email;

                const { data: enrollData, error: enrollError } = await api.auth.mfa.enroll({ 
                    factorType: 'totp',
                    issuer: 'City-map',
                    friendlyName: safeFriendlyName 
                });
                if (enrollError) throw enrollError;
                
                setFactorId(enrollData.id);
                setQrCodeUrl(enrollData.totp.uri); 
                setStep('mfa_setup');
            }
        } catch (err) {
            setError(err.message || t('admin_login.auth_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: challengeData, error: challengeError } = await api.auth.mfa.challenge({ factorId });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await api.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;
        } catch {
            setError(t('admin_login.invalid_code'));
            setMfaCode(''); 
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = async () => {
        await api.auth.signOut();
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex justify-center items-center p-5 bg-main font-sans">
            <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl shadow-xl p-8 sm:p-10 animate-[fadeIn_0.4s_ease-out]">
                
                <div className="mx-auto w-16 h-16 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <FaShieldAlt className="text-[2rem] text-blue-600" />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-[1.75rem] text-textMain m-0 mb-2 font-extrabold tracking-tight">{t('admin_login.title')}</h1>
                    <p className="text-textMuted m-0 text-[0.95rem] font-medium">{t('admin_login.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-danger p-3.5 rounded-xl mb-6 text-[0.9rem] text-center font-bold border border-red-500/20 shadow-sm flex items-center justify-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {step === 'credentials' && (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-bold text-[0.85rem] ml-1 uppercase tracking-wider opacity-80">{t('admin_login.email_label')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-textMuted/60" />
                                </div>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    required 
                                    placeholder="admin@citymap.com"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-border text-[1rem] transition-all box-border bg-main/50 text-textMain focus:outline-none focus:border-blue-500 focus:bg-surface focus:ring-4 focus:ring-blue-500/10 font-bold" 
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-bold text-[0.85rem] ml-1 uppercase tracking-wider opacity-80">{t('admin_login.password_label')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaLock className="text-textMuted/60" />
                                </div>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-border text-[1rem] transition-all box-border bg-main/50 text-textMain focus:outline-none focus:border-blue-500 focus:bg-surface focus:ring-4 focus:ring-blue-500/10 font-bold" 
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full mt-4 py-4 px-6 bg-blue-600 text-white border-none rounded-xl text-[1.1rem] font-black cursor-pointer transition-all shadow-lg hover:bg-blue-700 active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {t('admin_login.checking')}</>
                            ) : t('admin_login.login_btn')}
                        </button>
                    </form>
                )}

                {step === 'mfa_setup' && (
                    <form onSubmit={handleMfaSubmit} className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="text-center p-6 bg-main/50 rounded-2xl border-2 border-dashed border-border">
                            <div className="flex items-center justify-center gap-2 mb-4 text-blue-600 font-bold uppercase text-xs tracking-widest">
                                <FaQrcode /> {t('admin_login.scan_qr')}
                            </div>
                            <div className="bg-white p-3 inline-block rounded-xl shadow-md border border-border">
                                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={160} />}
                            </div>
                            <p className="text-[0.75rem] text-textMuted mt-4 font-medium leading-relaxed">
                                {t('admin_login.mfa_setup_hint')}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-bold text-[0.85rem] text-center uppercase tracking-wider opacity-80">{t('admin_login.code_label')}</label>
                            <input 
                                type="text" 
                                value={mfaCode} 
                                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))} 
                                required 
                                placeholder="000 000" 
                                maxLength="6" 
                                className="w-full p-5 bg-main border-2 border-border rounded-xl focus:border-blue-600 focus:bg-surface text-center tracking-[12px] text-2xl font-black outline-none transition-all" 
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={handleRestart} disabled={loading} className="flex-1 py-4 bg-surface text-textMain border border-border rounded-xl text-[0.95rem] font-bold transition-all hover:bg-main">{t('admin_login.cancel')}</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl text-[0.95rem] font-black shadow-md hover:bg-blue-700">
                                {loading ? t('admin_login.wait') : t('admin_login.confirm')}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'mfa_verify' && (
                    <form onSubmit={handleMfaSubmit} className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-600/20">
                                <FaMobileAlt className="text-blue-600 text-[1.8rem]" />
                            </div>
                            <p className="text-textMain font-bold text-[1.1rem] mb-1">{t('admin_login.mfa_code_label')}</p>
                            <p className="text-textMuted text-xs font-medium">{t('admin_login.mfa_verify_hint')}</p>
                        </div>

                        <input 
                            type="text" 
                            value={mfaCode} 
                            onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))} 
                            required 
                            placeholder="000 000" 
                            maxLength="6" 
                            autoFocus 
                            className="w-full p-5 bg-main border-2 border-border rounded-xl focus:border-blue-600 focus:bg-surface text-center tracking-[12px] text-2xl font-black outline-none transition-all" 
                        />
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={handleRestart} disabled={loading} className="flex-1 py-4 bg-surface text-textMain border border-border rounded-xl text-[0.95rem] font-bold transition-all hover:bg-main">{t('admin_login.exit')}</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl text-[0.95rem] font-black shadow-lg hover:bg-blue-700 flex justify-center items-center gap-2">
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {t('admin_login.wait')}</>
                                ) : t('admin_login.login_btn')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
