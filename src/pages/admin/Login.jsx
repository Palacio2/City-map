import React, { useState } from 'react';
import { supabase } from '@supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import styles from './Login.module.css';
import { useTranslation } from 'react-i18next';

export default function Login() {
    const { t } = useTranslation('admin');
    const [step, setStep] = useState('pin'); 
    const [pin, setPin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    
    const [factorId, setFactorId] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePinSubmit = (e) => {
        e.preventDefault();
        const correctPin = import.meta.env.VITE_PANEL_PIN;
        if (pin === correctPin) {
            setStep('credentials');
            setError(null);
        } else {
            setError(t('login.invalidPin'));
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            const userRole = data.user.app_metadata?.role;
            if (userRole !== 'admin' && userRole !== 'super_admin') {
                await supabase.auth.signOut();
                throw new Error(t('login.accessDenied'));
            }

            const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;

            const totpFactors = factorsData.totp || [];
            const verifiedFactor = totpFactors.find(f => f.status === 'verified');
            const unverifiedFactors = totpFactors.filter(f => f.status === 'unverified');

            if (verifiedFactor) {
                setFactorId(verifiedFactor.id);
                setStep('mfa_verify');
            } else {
                for (const uf of unverifiedFactors) {
                    await supabase.auth.mfa.unenroll({ factorId: uf.id });
                }

                const safeFriendlyName = unverifiedFactors.length > 0 
                    ? `${email} (${t('login.attempt')} ${unverifiedFactors.length + 1})` 
                    : email;

                const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({ 
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
            setError(err.message || t('login.authError'));
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;
            window.location.reload();
        } catch {
            setError(t('login.invalidCode'));
            setMfaCode(''); 
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('login.title')}</h1>
                    <p className={styles.subtitle}>{t('login.subtitle')}</p>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}

                {step === 'pin' && (
                    <form onSubmit={handlePinSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('login.pinLabel')}</label>
                            <input type="password" value={pin} onChange={e => setPin(e.target.value)} required className={styles.input} placeholder="••••" autoFocus />
                        </div>
                        <button type="submit" className={styles.submitBtn}>{t('login.continue')}</button>
                    </form>
                )}

                {step === 'credentials' && (
                    <form onSubmit={handleLoginSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('login.emailLabel')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('login.passwordLabel')}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} />
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? t('login.checking') : t('login.loginBtn')}</button>
                    </form>
                )}

                {step === 'mfa_setup' && (
                    <form onSubmit={handleMfaSubmit} className={styles.form}>
                        <div className={styles.mfaQrSection}>
                            <p>{t('login.scanQr')}</p>
                            <div className={styles.qrCodeWrapper}>
                                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('login.codeLabel')}</label>
                            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required className={`${styles.input} ${styles.mfaInput}`} placeholder="123456" maxLength="6" />
                        </div>
                        <div className={styles.buttonGroup}>
                            <button type="button" onClick={handleRestart} disabled={loading} className={styles.cancelBtn}>{t('login.cancel')}</button>
                            <button type="submit" disabled={loading} className={styles.submitBtn} style={{ flex: 2 }}>{loading ? t('login.wait') : t('login.confirm')}</button>
                        </div>
                    </form>
                )}

                {step === 'mfa_verify' && (
                    <form onSubmit={handleMfaSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{t('login.mfaCodeLabel')}</label>
                            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required className={`${styles.input} ${styles.mfaInput}`} placeholder="123456" maxLength="6" autoFocus />
                        </div>
                        <div className={styles.buttonGroup}>
                            <button type="button" onClick={handleRestart} disabled={loading} className={styles.cancelBtn}>{t('login.exit')}</button>
                            <button type="submit" disabled={loading} className={styles.submitBtn} style={{ flex: 2 }}>{loading ? t('login.wait') : t('login.loginBtn')}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}