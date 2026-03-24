import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';

export default function Login() {
    const { t } = useTranslation('admin');
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
                setError(t('login.accessDenied'));
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
                    ? `${email} (${t('login.attempt')} ${unverifiedFactors.length + 1})` 
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
            const { data: challengeData, error: challengeError } = await api.auth.mfa.challenge({ factorId });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await api.auth.mfa.verify({
                factorId,
                challengeId: challengeData.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;
            // AdminPanel автоматично "спіймає" MFA_CHALLENGE_VERIFIED і приховає Login!
        } catch {
            setError(t('login.invalidCode'));
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
        <div className="flex justify-center items-start sm:items-center min-h-screen bg-main p-5 pt-[10vh] sm:pt-5 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.08),transparent_40%)]">
            <div className="bg-transparent sm:bg-surface px-6 py-8 sm:px-10 sm:py-12 border-none sm:border border-border rounded-none sm:rounded-lg shadow-none sm:shadow-glass w-full max-w-[420px] animate-slideUpModal sm:backdrop-blur-md">
                <div className="text-center mb-9">
                    <h1 className="text-3xl text-textMain m-0 mb-2.5 font-extrabold tracking-tight">{t('login.title')}</h1>
                    <p className="text-textMuted m-0 text-base font-medium">{t('login.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-danger p-3.5 rounded-sm mb-6 text-[0.95rem] text-center font-semibold border border-red-500/20">
                        {error}
                    </div>
                )}

                {step === 'credentials' && (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-semibold text-[0.95rem] ml-0.5">{t('login.emailLabel')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3.5 rounded-md border-2 border-border text-[1.05rem] transition-all box-border bg-main text-textMain focus:outline-none focus:border-primary focus:bg-surface focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-semibold text-[0.95rem] ml-0.5">{t('login.passwordLabel')}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3.5 rounded-md border-2 border-border text-[1.05rem] transition-all box-border bg-main text-textMain focus:outline-none focus:border-primary focus:bg-surface focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full p-4 bg-primary text-white border-none rounded-md text-[1.05rem] font-bold cursor-pointer mt-3 transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] active:translate-y-[1px] active:shadow-none disabled:bg-textMuted disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:transform-none">
                            {loading ? t('login.checking') : t('login.loginBtn')}
                        </button>
                    </form>
                )}

                {step === 'mfa_setup' && (
                    <form onSubmit={handleMfaSubmit} className="flex flex-col gap-5">
                        <div className="text-center mb-5 p-5 bg-main rounded-md">
                            <p className="text-[0.95rem] text-textMuted mb-4 font-medium">{t('login.scanQr')}</p>
                            <div className="bg-white p-4 inline-block rounded-md shadow-sm">
                                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={200} />}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-semibold text-[0.95rem] ml-0.5">{t('login.codeLabel')}</label>
                            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required placeholder="123456" maxLength="6" className="w-full p-3.5 rounded-md border-2 border-border transition-all box-border bg-main text-textMain focus:outline-none focus:border-primary focus:bg-surface focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] text-center tracking-[8px] text-2xl font-bold" />
                        </div>
                        <div className="flex gap-3 mt-3">
                            <button type="button" onClick={handleRestart} disabled={loading} className="flex-1 p-4 bg-main text-textMuted border-2 border-transparent rounded-md text-[1.05rem] font-bold cursor-pointer transition-all hover:bg-border hover:text-textMain disabled:opacity-70">{t('login.cancel')}</button>
                            <button type="submit" disabled={loading} className="flex-[2] p-4 bg-primary text-white border-none rounded-md text-[1.05rem] font-bold cursor-pointer transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] active:translate-y-[1px] active:shadow-none disabled:bg-textMuted disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:transform-none">{loading ? t('login.wait') : t('login.confirm')}</button>
                        </div>
                    </form>
                )}

                {step === 'mfa_verify' && (
                    <form onSubmit={handleMfaSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-textMain font-semibold text-[0.95rem] ml-0.5">{t('login.mfaCodeLabel')}</label>
                            <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value)} required placeholder="123456" maxLength="6" autoFocus className="w-full p-3.5 rounded-md border-2 border-border transition-all box-border bg-main text-textMain focus:outline-none focus:border-primary focus:bg-surface focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] text-center tracking-[8px] text-2xl font-bold" />
                        </div>
                        <div className="flex gap-3 mt-3">
                            <button type="button" onClick={handleRestart} disabled={loading} className="flex-1 p-4 bg-main text-textMuted border-2 border-transparent rounded-md text-[1.05rem] font-bold cursor-pointer transition-all hover:bg-border hover:text-textMain disabled:opacity-70">{t('login.exit')}</button>
                            <button type="submit" disabled={loading} className="flex-[2] p-4 bg-primary text-white border-none rounded-md text-[1.05rem] font-bold cursor-pointer transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] active:translate-y-[1px] active:shadow-none disabled:bg-textMuted disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none disabled:transform-none">{loading ? t('login.wait') : t('login.loginBtn')}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}