import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft, FaHome } from 'react-icons/fa';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { plan, amount, price, features } = location.state || {
    plan: 'Pro', amount: 149, price: '149 грн/міс', features: []
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft /> Назад
        </button>
        <div className={styles.titleSection}>
          <h1>Оплата успішна!</h1>
          <p>Ваш тариф активовано</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.successHeader}>
            <div className={styles.successIcon}><FaCheckCircle /></div>
            <div className={styles.successText}>
              <h2>Оплата пройшла успішно</h2>
              <p>Дякуємо за вашу покупку! Ваш тариф активовано.</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaCheckCircle />
            <h2>Деталі замовлення</h2>
          </div>
          
          <div className={styles.orderDetails}>
            {[
              ['Тарифний план:', plan],
              ['Сума оплати:', `${amount} грн`],
              ['Період:', '1 місяць'],
              ['Дата оплати:', new Date().toLocaleDateString('uk-UA')],
              ['ID транзакції:', `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`]
            ].map(([label, value], index) => (
              <div key={index} className={styles.detailRow}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaCheckCircle />
            <h2>Активовані функції</h2>
          </div>
          
          <div className={styles.featuresList}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <FaCheckCircle />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.infoBox}>
            <h3>Що далі?</h3>
            <p>Ваш тариф активовано негайно. Ви можете скористатися всіма функціями у вашому профілі.</p>
            
            <div className={styles.nextSteps}>
              {[
                'Перейдіть у ваш профіль',
                'Скористайтеся новими функціями', 
                'Налаштуйте підписку у будь-який час'
              ].map((step, index) => (
                <div key={index} className={styles.step}>
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepText}>{step}</div>
                </div>
              ))}
            </div>
            
            <button onClick={() => navigate('/profile')} className={styles.profileButton}>
              Перейти до профілю
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}