import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>GeoAnalyzer</h3>
          <p>Аналіз геопросторових даних для прийняття рішень</p>
        </div>
        <div className={styles.footerSection}>
          <h4>Навігація</h4>
          <a href="/">Головна</a>
          <a href="/about">Про проект</a>
          <a href="/contacts">Контакти</a>
        </div>
        <div className={styles.footerSection}>
          <h4>Контакти</h4>
          <p>email: info@geoanalyzer.com</p>
          <p>тел: +380 00 000 00 00</p>
        </div>
      </div>
      <div className={styles.copyright}>
        © {new Date().getFullYear()} GeoAnalyzer. Всі права захищені.
      </div>
    </footer>
  );
}