import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaEnvelope } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from './FaqPage.module.css';

export default function FaqPage() {
  const { t } = useTranslation('faq');
  const [activeCategory, setActiveCategory] = useState('general');
  const [openIndex, setOpenIndex] = useState(null);

  const categories = [
    { id: 'general', icon: '🌍' },
    { id: 'subscription', icon: '💎' },
    { id: 'data', icon: '📊' },
    { id: 'account', icon: '👤' }
  ];

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const questions = t(`questions.${activeCategory}`, { returnObjects: true });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <FaQuestionCircle />
        </div>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.content}>
        <div className={styles.categories}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryButton} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(null);
              }}
            >
              <span className={styles.categoryIcon}>{cat.icon}</span>
              {t(`categories.${cat.id}`)}
            </button>
          ))}
        </div>

        <div className={styles.questionsList}>
          {Array.isArray(questions) && questions.map((item, index) => (
            <div 
              key={index} 
              className={`${styles.questionItem} ${openIndex === index ? styles.open : ''}`}
            >
              <button 
                className={styles.questionHeader} 
                onClick={() => toggleQuestion(index)}
              >
                <span className={styles.questionTitle}>{item.q}</span>
                <span className={styles.toggleIcon}>
                  {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </button>
              
              <div 
                className={styles.answerWrapper}
                style={{ maxHeight: openIndex === index ? '500px' : '0' }}
              >
                <div className={styles.answerContent}>
                  {item.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <h3>{t('still_have_questions')}</h3>
        <Link to="/contacts" className={styles.contactButton}>
          <FaEnvelope /> {t('contact_support')}
        </Link>
      </div>
    </div>
  );
}