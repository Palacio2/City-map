import React from 'react';
import styles from './Loader.module.css';

export default function Loader({ 
  size = 'medium', 
  fullScreen = false, 
  text = null,
  className = ''
}) {
  const containerClass = fullScreen ? styles.fullScreenContainer : styles.container;
  const spinnerClass = `${styles.spinner} ${styles[size]}`;

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={spinnerClass}></div>
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}