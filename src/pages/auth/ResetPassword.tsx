import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import { PasswordChangeModal } from '../profile/components/PasswordChangeModal';

// Supabase consumes the recovery fragment before exposing the verified session.
// Keep this route public so an expired link can offer a fresh recovery email.
export default function ResetPassword() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  if (isLoading) return <p role="status">{t('auth.callback.loading')}</p>;
  if (isAuthenticated) return <PasswordChangeModal isOpen onClose={() => navigate('/profile', { replace: true })} />;
  return <section className="mx-auto max-w-lg p-8 text-textMain" role="alert">
    <h1 className="text-2xl font-bold mb-4">{t('auth.recovery.invalid', { defaultValue: 'The recovery link is invalid or expired. Request a new link.' })}</h1>
    <Link className="text-primary underline" to="/forgot-password">{t('auth.recovery.retry', { defaultValue: 'Request a new recovery link' })}</Link>
  </section>;
}
