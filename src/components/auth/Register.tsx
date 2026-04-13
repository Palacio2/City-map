import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaUser, FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import useAuthRedirect from '@hooks/useAuthRedirect';
import { useSocialLogin } from '@hooks/useSocialLogin';
import { AuthInput } from '@/components/auth/AuthInput';
import { getRegisterSchema, RegisterFormValues } from './validation';

export default function Register() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const isAutoLoginAttempted = useAuthRedirect();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const socialLogin = useSocialLogin(setIsSocialLoading, (err: any) => setGlobalError(err?.submit || ''));

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({ resolver: zodResolver(getRegisterSchema(t)), mode: 'onTouched' });
  const pass = watch('password', '');
  const strength = !pass ? 0 : (pass.length > 7 ? 1 : 0) + (/[A-Z]/.test(pass) ? 1 : 0) + (/\d/.test(pass) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pass) ? 1 : 0);

  const { mutate, isPending } = useMutation({
    mutationFn: async (d: RegisterFormValues) => {
      const { data, error } = await supabase.auth.signUp({ email: d.email, password: d.password, options: { data: { full_name: d.name.trim() }, emailRedirectTo: `${globalThis.location.origin}/auth/callback` } });
      if (error) throw error; return data;
    },
    onSuccess: (d, v) => d.user?.identities?.length === 0 ? setGlobalError(t('auth.errors.user_exists')) : navigate('/register-success', { state: { email: v.email } }),
    onError: (e: any) => setGlobalError(e.message?.includes('already registered') ? t('auth.errors.user_exists') : t('auth.errors.generic'))
  });

  if (!isAutoLoginAttempted) return null;
  const isLoading = isPending || isSocialLoading;

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-0 sm:p-5">
      <div className="bg-surface rounded-t-[24px] sm:rounded-2xl p-8 px-6 sm:p-10 w-full max-w-[450px] shadow-card border-t sm:border border-borderClient mt-auto sm:mt-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-textMain mb-2 font-heading">{t('auth.register.title')}</h1>
          <p className="text-textSecondary m-0">{t('auth.register.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit((d) => { setGlobalError(''); mutate(d); })} className="flex flex-col gap-5">
          <AuthInput label={t('auth.fields.name')} icon={FaUser} type="text" blockType="name" placeholder={t('auth.fields.name_placeholder')} disabled={isLoading} error={errors.name?.message} {...register('name')} />
          <AuthInput label={t('auth.fields.email')} icon={FaEnvelope} type="email" blockType="auth" placeholder={t('auth.fields.email_placeholder')} disabled={isLoading} error={errors.email?.message} {...register('email')} />
          <div>
            <AuthInput label={t('auth.fields.password')} icon={FaLock} type="password" blockType="auth" placeholder={t('auth.fields.password_min')} disabled={isLoading} error={errors.password?.message} {...register('password')} />
            {pass && <div className="flex gap-1 mt-2">{[1, 2, 3, 4].map(l => <div key={l} className={`h-1.5 flex-1 rounded-full ${strength < l ? 'bg-borderClient' : strength < 2 ? 'bg-danger' : strength < 4 ? 'bg-warning' : 'bg-success'}`} />)}</div>}
          </div>
          <AuthInput label={t('auth.fields.confirm_password')} icon={FaLock} type="password" blockType="auth" placeholder={t('auth.fields.confirm_placeholder')} disabled={isLoading} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          {globalError && <div className="text-danger text-center font-medium text-[0.9rem]">{globalError}</div>}
          <button type="submit" disabled={isLoading} className="w-full p-4 bg-textMain text-surface rounded-md font-semibold tracking-widest uppercase hover:bg-accent disabled:opacity-70">
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span> : t('auth.register.submit')}
          </button>
        </form>
        <div className="flex items-center my-6 text-textSecondary text-[0.85rem] before:flex-1 before:h-px before:bg-borderClient after:flex-1 after:h-px after:bg-borderClient"><span className="px-4">{t('auth.login.or')}</span></div>
        <button onClick={() => socialLogin('google')} disabled={isLoading} className="w-full py-[0.85rem] border border-borderClient rounded-md font-semibold flex items-center justify-center gap-3 hover:border-accent">
          <FaGoogle className="text-accent text-[1.1rem]" /> {t('auth.register.social', { provider: 'Google' })}
        </button>
        <div className="text-center text-textSecondary text-[0.9rem] mt-4 pt-4">
          {t('auth.register.has_account')} <Link to="/login" className="text-accent font-semibold hover:underline">{t('auth.register.login_link')}</Link>
        </div>
      </div>
    </div>
  );
}