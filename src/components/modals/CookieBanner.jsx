import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCookieBite, FaTimes } from 'react-icons/fa';
import styles from './CookieBanner.module.css';

export default function CookieBanner() {
  const { t } = useTranslation('rodo');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}><FaCookieBite className={styles.icon} /></div>
        <div className={styles.text}>
          <p>{t('cookies.text')} <Link to="/terms" className={styles.link}>{t('cookies.link')}</Link></p>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.acceptBtn} onClick={accept}>{t('cookies.accept')}</button>
        <button className={styles.closeBtn} onClick={() => setVisible(false)}><FaTimes/></button>
      </div>
    </div>
  );
}
