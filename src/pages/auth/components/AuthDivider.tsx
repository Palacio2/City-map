import { useTranslation } from 'react-i18next';

export const AuthDivider = () => {
  const { t } = useTranslation('db');
  return (
    <div className="flex items-center my-6 text-textSecondary text-[0.85rem] before:flex-1 before:h-px before:bg-borderClient after:flex-1 after:h-px after:bg-borderClient">
      <span className="px-4 opacity-70 uppercase tracking-widest text-[11px] font-bold">{t('auth.common.or')}</span>
    </div>
  );
};
