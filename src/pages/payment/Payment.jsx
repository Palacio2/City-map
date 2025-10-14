import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  FaCreditCard, 
  FaLock, 
  FaCheckCircle, 
  FaArrowLeft,
  FaSync,
  FaShieldAlt
} from 'react-icons/fa';
import { useSubscription } from '../subscription/SubscriptionContext';
import { processPayment } from '../../components/api/paymentApi';
import styles from './Payment.module.css';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateSubscription } = useSubscription();
  
  const planData = location.state || {};
  const plan = planData.plan || 'Pro';
  const planPrice = planData.price || (plan === 'Pro' ? '149 грн/міс' : '299 грн/міс');
  const planFeaturesList = planData.features || [];

  const [paymentData, setPaymentData] = useState({
    cardNumber: '', expiryDate: '', cvv: '', cardholder: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  const planFeatures = {
    'Безкоштовний': [
      'Базова карта району', 'Обмежені фільтри', 'Перегляд основних об\'єктів'
    ],
    'Pro': planFeaturesList.length > 0 ? planFeaturesList : [
      'Повний доступ до всіх фільтрів', 'Детальна інформація про нерухомість',
      'Рейтинги медичних закладів', 'Транспортна доступність', 'Збереження улюблених районів'
    ],
    'Premium': planFeaturesList.length > 0 ? planFeaturesList : [
      'Все з тарифу Pro +', 'Персональний консультант', 'Доступ до ексклюзивних даних',
      'Прогноз розвитку районів', 'Інвестиційні рекомендації'
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Номер картки має містити 16 цифр';
    }
    
    if (!paymentData.expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Невірний формат ММ/РР';
    }
    
    if (!paymentData.cvv || paymentData.cvv.length !== 3) {
      newErrors.cvv = 'CVV має містити 3 цифри';
    }
    
    if (!paymentData.cardholder) {
      newErrors.cardholder = "Ім'я власника картки обов'язкове";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsProcessing(true);
    try {
      const fakePaymentId = 'pay_' + Date.now();
      await processPayment(plan.toLowerCase(), fakePaymentId);
      
      const { data: subscription } = await supabase.from('user_subscriptions').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (subscription) updateSubscription(subscription);
      
      navigate('/payment-success', { 
        state: { 
          plan,
          amount: plan === 'Pro' ? 149 : 299,
          price: planPrice,
          features: planFeatures[plan]
        }
      });
    } catch (error) {
      setErrors({ submit: error.message || 'Помилка оплати. Спробуйте ще раз.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setPaymentData(prev => ({ ...prev, cardNumber: formattedValue }));
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
    setPaymentData(prev => ({ ...prev, expiryDate: value }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft /> Назад до вибору тарифу
        </button>
        <div className={styles.titleSection}>
          <h1>Оплата підписки</h1>
          <p>Завершіть оплату для активації тарифу</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaCheckCircle />
            <h2>Обраний тариф: {plan}</h2>
          </div>
          
          <div className={styles.planInfo}>
            <div className={styles.planPriceSection}>
              <span>Вартість:</span>
              <span>{planPrice}</span>
            </div>
            
            <div className={styles.planFeatures}>
              <h3>Що включено:</h3>
              <div className={styles.featuresGrid}>
                {planFeatures[plan].map((feature, index) => (
                  <div key={index} className={styles.featureItem}>
                    <FaCheckCircle />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaCreditCard />
            <h2>Дані платіжної картки</h2>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.paymentForm}>
            <div className={styles.formGroup}>
              <label>Номер картки</label>
              <input
                type="text"
                name="cardNumber"
                value={paymentData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className={errors.cardNumber ? styles.inputError : ''}
                disabled={isProcessing}
              />
              {errors.cardNumber && <span className={styles.error}>{errors.cardNumber}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Термін дії</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={paymentData.expiryDate}
                  onChange={handleExpiryDateChange}
                  placeholder="ММ/РР"
                  maxLength="5"
                  className={errors.expiryDate ? styles.inputError : ''}
                  disabled={isProcessing}
                />
                {errors.expiryDate && <span className={styles.error}>{errors.expiryDate}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>CVV код</label>
                <input
                  type="password"
                  name="cvv"
                  value={paymentData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength="3"
                  className={errors.cvv ? styles.inputError : ''}
                  disabled={isProcessing}
                />
                {errors.cvv && <span className={styles.error}>{errors.cvv}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Ім'я власника картки</label>
              <input
                type="text"
                name="cardholder"
                value={paymentData.cardholder}
                onChange={handleChange}
                placeholder="John Doe"
                className={errors.cardholder ? styles.inputError : ''}
                disabled={isProcessing}
              />
              {errors.cardholder && <span className={styles.error}>{errors.cardholder}</span>}
            </div>

            {errors.submit && <div className={styles.errorSubmit}>{errors.submit}</div>}

            <button type="submit" className={styles.payButton} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <FaSync className={styles.spinner} />
                  Обробка оплати...
                </>
              ) : (
                <>
                  <FaLock />
                  Сплатити {plan === 'Pro' ? '149 грн' : plan === 'Premium' ? '299 грн' : '0 грн'}
                </>
              )}
            </button>
          </form>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaShieldAlt />
            <h2>Безпека оплати</h2>
          </div>
          
          <div className={styles.securityInfo}>
            <div className={styles.securityItem}>
              <div className={styles.securityIcon}><FaShieldAlt /></div>
              <div>
                <h4>Захищене з'єднання</h4>
                <p>Всі дані передаються через зашифроване з'єднання</p>
              </div>
            </div>
            
            <div className={styles.securityItem}>
              <div className={styles.securityIcon}><FaLock /></div>
              <div>
                <h4>Безпека даних</h4>
                <p>Ми не зберігаємо дані вашої картки</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}