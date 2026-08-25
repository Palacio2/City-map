import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import { api } from '@services/api';
import { AuthStep } from '@admin/core/types/login.types';
import { useAdmin } from '@admin/core/context/AdminContext';

export function useAdminAuth() {
  const { t } = useTranslation('db');
  const { adminLogin } = useAdmin();
  const [step, setStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const userRole = data.user?.app_metadata?.role;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        await supabase.auth.signOut();
        setError(t('admin_login.access_denied'));
        setLoading(false);
        return;
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactors = factorsData.totp || [];
      const verifiedFactor = totpFactors.find((f: { status: string; id: string }) => f.status === 'verified');
      const unverifiedFactors = totpFactors.filter((f: { status: string; id: string }) => f.status === 'unverified');

      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
        setStep('mfa_verify');
      } else {
        for (const uf of unverifiedFactors) {
          await supabase.auth.mfa.unenroll({ factorId: uf.id });
        }

        const safeFriendlyName = unverifiedFactors.length > 0
          ? `${email} (${t('admin_login.attempt')} ${unverifiedFactors.length + 1})`
          : email;

        const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'CityMaps',
          friendlyName: safeFriendlyName
        });
        if (enrollError) throw enrollError;

        setFactorId(enrollData.id);
        setQrCodeUrl(enrollData.totp.uri);
        setStep('mfa_setup');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('admin_login.auth_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!factorId) throw new Error('Missing factorId');

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: mfaCode
      });

      if (verifyError) throw verifyError;
      
      // Log successful 2FA
      await api.auth.insertAuthLog().catch(e => console.error('Failed to log auth', e));

      // Активуємо адмін-сесію (очищаємо прапорець виходу)
      adminLogin();

    } catch {
      setError(t('admin_login.invalid_code'));
      setMfaCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    mfaCode,
    setMfaCode,
    qrCodeUrl,
    loading,
    error,
    handleLoginSubmit,
    handleMfaSubmit,
    handleRestart
  };
}