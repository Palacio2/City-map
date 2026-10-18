import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguageDropdown = () => {
  const { t, i18n } = useTranslation('db');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };
    if (showLanguageDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageDropdown]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
  };

  return {
    t,
    showLanguageDropdown,
    setShowLanguageDropdown,
    langRef,
    changeLanguage,
  };
};
