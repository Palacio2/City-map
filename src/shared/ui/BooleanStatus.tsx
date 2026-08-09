import React from 'react';
import { FaCheck, FaTimes, FaMinus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface BooleanStatusProps {
  value: boolean | null | undefined;
  useIcons?: boolean;
}

export const BooleanStatus: React.FC<BooleanStatusProps> = ({ value, useIcons = false }) => {
  const { t } = useTranslation('db');

  if (useIcons) {
    if (value === true) return <FaCheck className="text-success font-bold" />;
    if (value === false) return <FaTimes className="text-textSecondary opacity-50" />;
    return <FaMinus className="text-textSecondary opacity-50" />;
  }

  if (value === true) return <span className="text-success font-bold">{t('common.status.yes')}</span>;
  if (value === false) return <span className="text-textSecondary opacity-50">{t('common.status.no')}</span>;
  return <span>{t('common.status.na')}</span>;
};