// src/components/Contacts.jsx
import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaComment, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaHome } from 'react-icons/fa';
import { contactsAPI } from '../../components/api/contactsAPI';
import styles from './Contacts.module.css';

export default function Contacts() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Ім'я обов'язкове";
    if (!formData.email.trim()) newErrors.email = "Електронна пошта обов'язкова";
    else if (!validateEmail(formData.email)) newErrors.email = "Будь ласка, введіть коректну email адресу";
    if (!formData.message.trim()) newErrors.message = "Повідомлення не може бути порожнім";
    else if (formData.message.trim().length < 10) newErrors.message = "Повідомлення має містити принаймні 10 символів";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await contactsAPI.submitMessage(formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: error.message || 'Сталася невідома помилка при відправці.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successMessage}>
            <FaPaperPlane className={styles.successIcon} />
            <h1>Дякуємо!</h1>
            <p>Ваше повідомлення успішно відправлено. Ми зв'яжемося з вами найближчим часом.</p>
            <button 
              onClick={() => window.location.href = '/'} 
              className={styles.submitButton}
            >
              <FaHome className={styles.sendIcon} />
              На головну сторінку
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Зв'яжіться з нами</h1>
        <p className={styles.subtitle}>Надішліть нам своє повідомлення, і ми відповімо якнайшвидше.</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {['name', 'email', 'message'].map((field) => (
            <div key={field} className={styles.formGroup}>
              <label htmlFor={field} className={styles.label}>
                {field === 'name' && <FaUser className={styles.icon} />}
                {field === 'email' && <FaEnvelope className={styles.icon} />}
                {field === 'message' && <FaComment className={styles.icon} />}
                {field === 'name' ? "Ім'я" : field === 'email' ? 'Електронна пошта' : 'Повідомлення'}
              </label>
              {field === 'message' ? (
                <textarea
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder={field === 'name' ? "Ваше ім'я" : field === 'email' ? 'Ваша електронна пошта' : 'Ваше повідомлення'}
                  className={errors[field] ? styles.textareaError : styles.textarea}
                />
              ) : (
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  id={field}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  placeholder={field === 'name' ? "Ваше ім'я" : 'Ваша електронна пошта'}
                  className={errors[field] ? styles.inputError : styles.input}
                />
              )}
              {errors[field] && <span className={styles.error}>{errors[field]}</span>}
            </div>
          ))}
          
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Відправка...
              </>
            ) : (
              <>
                <FaPaperPlane className={styles.sendIcon} />
                Відправити
              </>
            )}
          </button>
        </form>
        
        <div className={styles.contactInfo}>
          <h3>Або зв'яжіться з нами іншим способом:</h3>
          <div className={styles.contactMethods}>
            <div className={styles.contactItem}>
              <FaEnvelope className={styles.contactIcon} />
              <span>email@example.com</span>
            </div>
            <div className={styles.contactItem}>
              <FaPhone className={styles.contactIcon} />
              <span>+380 (XX) XXX-XX-XX</span>
            </div>
            <div className={styles.contactItem}>
              <FaMapMarkerAlt className={styles.contactIcon} />
              <span>м. Київ, вул. Примерна, 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}