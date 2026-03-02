import React, { useState } from 'react';
import { supabase } from '@supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import styles from './Login.module.css';

export default function Login() {
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
        const correctPin = import.meta.env.VITE_PANEL_PIN || '1234';
        if (pin === correctPin) {
            setStep('credentials');
            setError(null);
        } else {
            setError('Невірний PIN-код панелі');
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            // ПЕРЕВІРКА ТОКЕНА
            if (data.user.app_metadata?.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error('Доступ заборонено: Ваш акаунт не має прав адміністратора.');
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
                    ? `${email} (Спроба ${unverifiedFactors.length + 1})` 
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
            setError(err.message || 'Помилка авторизації');
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

            const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;
            window.location.reload();
        } catch (err) {
            setError('Невірний код. Зачекайте на новий код у додатку і спробуйте ще раз.');
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
                    <h1 className={styles.title}>🔐 Вхід в систему</h1>
                    <p className={styles.subtitle}>City Maps Admin v4.0</p>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}

                {step === 'pin' && (
                    <form onSubmit={handlePinSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Секретний PIN панелі</label>
                            <input type="password" value={pin} onChange={e => setPin(e.target.value)} required className={styles.input} placeholder="••••" autoFocus />
                        </div>
                        <button type="submit" className={styles.submitBtn}>Продовжити</button>
                    </form>
                )}

                {step === 'credentials' && (
                    <form onSubmit={handleLoginSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email адміністратора</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={styles.input} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Пароль</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} />
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? '⏳ Перевірка...' : 'Увійти'}</button>
                    </form>
                )}

                {step === 'mfa_setup' && (
                    <form onSubmit={handleMfaSubmit} className={styles.form}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '15px' }}>Відскануйте цей QR-код у додатку Google Authenticator.</p>
                            <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Введіть 6-значний код</label>
                            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required className={styles.input} placeholder="123456" maxLength="6" style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={handleRestart} disabled={loading} className={styles.submitBtn} style={{ background: '#f1f5f9', color: '#475569', flex: 1 }}>Скасувати</button>
                            <button type="submit" disabled={loading} className={styles.submitBtn} style={{ flex: 2 }}>{loading ? '⏳...' : 'Підтвердити'}</button>
                        </div>
                    </form>
                )}

                {step === 'mfa_verify' && (
                    <form onSubmit={handleMfaSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Код двофакторної автентифікації</label>
                            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required className={styles.input} placeholder="123456" maxLength="6" style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} autoFocus />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={handleRestart} disabled={loading} className={styles.submitBtn} style={{ background: '#f1f5f9', color: '#475569', flex: 1 }}>Вийти</button>
                            <button type="submit" disabled={loading} className={styles.submitBtn} style={{ flex: 2 }}>{loading ? '⏳...' : 'Увійти'}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}