import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './ProfileEditPages.module.css';

export default function AccountActionsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> Назад до профілю
        </Link>
        <h1 className={styles.title}>Дії з акаунтом</h1>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <p>Тут будуть дії з акаунтом...</p>
        </div>
      </div>
    </div>
  );
}