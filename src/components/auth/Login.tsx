import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import useAuthRedirect from '@hooks/useAuthRedirect'; 
import { useSocialLogin } from '@hooks/useSocialLogin';
import { AuthInput } from '@/components/auth/AuthInput';
import { getLoginSchema, LoginFormValues } from './validation';

export default function Login() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAutoLoginAttempted = useAuthRedirect();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const socialLogin = useSocialLogin(setIsSocialLoading, (err: any) => setGlobalError(err?.submit || ''));

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(getLoginSchema(t)),
    defaultValues: { email: localStorage.getItem('userEmail') || '', rememberMe: localStorage.getItem('rememberMe') === 'true' }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password });
      if (error) throw error; return data;
    },
    onSuccess: (_, { rememberMe, email }) => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      rememberMe ? localStorage.setItem('userEmail', email) : localStorage.removeItem('userEmail');
      rememberMe ? localStorage.setItem('rememberMe', 'true') : localStorage.removeItem('rememberMe');
      navigate('/', { replace: true });
    },
    onError: (e: any) => setGlobalError(e.status === 429 ? t('auth.errors.too_many_requests') : t('auth.errors.login_failed'))
  });

  if (!isAutoLoginAttempted) return null;
  const isLoading = isPending || isSocialLoading;

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-0 sm:p-5">
      <div className="bg-surface rounded-t-[24px] sm:rounded-2xl p-8 px-6 sm:p-10 w-full max-w-[450px] shadow-card border-t sm:border border-borderClient mt-auto sm:mt-0">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl font-bold text-textMain mb-2 font-heading">{t('auth.login.title')}</h1>
          <p className="text-textSecondary m-0">{t('auth.login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit((d) => { setGlobalError(''); mutate(d); })} className="flex flex-col gap-5">
          <AuthInput label={t('auth.fields.email')} icon={FaEnvelope} type="email" blockType="auth" placeholder={t('auth.fields.email_placeholder')} disabled={isLoading} error={errors.email?.message} {...register('email')} />
          <AuthInput label={t('auth.fields.password')} icon={FaLock} type="password" blockType="auth" placeholder={t('auth.fields.password_placeholder')} disabled={isLoading} error={errors.password?.message} {...register('password')} />
          <div className="flex justify-between items-center text-[0.9rem] -mt-1">
            <label className="flex items-center gap-2.5 text-textSecondary cursor-pointer py-2 group">
              <input type="checkbox" className="w-[18px] h-[18px] border border-borderClient rounded checked:bg-accent checked:border-accent" {...register('rememberMe')} />
              <span className="group-hover:text-textMain">{t('auth.login.remember_me')}</span>
            </label>
            <Link to="/forgot-password" className="text-accent font-semibold py-2 hover:underline">{t('auth.login.forgot_pass')}</Link>
          </div>
          {globalError && <div className="text-danger text-center font-medium text-[0.9rem]">{globalError}</div>}
          <button type="submit" disabled={isLoading} className="w-full p-4 bg-textMain text-surface rounded-md font-semibold tracking-widest uppercase hover:bg-accent disabled:opacity-70">
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span> : t('auth.login.submit')}
          </button>
        </form>
        <div className="flex items-center my-6 text-textSecondary text-[0.85rem] before:flex-1 before:h-px before:bg-borderClient after:flex-1 after:h-px after:bg-borderClient"><span className="px-4">{t('auth.login.or')}</span></div>
        <button onClick={() => socialLogin('google')} disabled={isLoading} className="w-full py-[0.85rem] border border-borderClient rounded-md font-semibold flex items-center justify-center gap-3 hover:border-accent">
          <FaGoogle className="text-accent text-[1.1rem]" /> {t('auth.login.social', { provider: 'Google' })}
        </button>
        <div className="text-center text-textSecondary text-[0.9rem] mt-4 pt-4">
          {t('auth.login.no_account')} <Link to="/register" className="text-accent font-semibold hover:underline">{t('auth.login.register_link')}</Link>
        </div>
      </div>
    </div>
  );
}