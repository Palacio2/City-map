import { Link } from 'react-router-dom';
import {  
  FaChartLine, FaUsers, FaRocket, FaLightbulb, FaShieldAlt,
  FaDatabase, FaMobile, FaGlobe, FaHeart, FaClock, FaSync
} from 'react-icons/fa';
import styles from './About.module.css';

const SECTION_CONFIG = {
  mission: { icon: FaRocket, title: 'Наша місія та візія' },
  features: { icon: FaLightbulb, title: 'Чому саме GeoAnalyzer?' },
  process: { icon: FaRocket, title: 'Детальний процес роботи' },
  data: { icon: FaDatabase, title: 'Джерела наших даних' },
  audience: { icon: FaUsers, title: 'Для кого створений наш сервіс?' },
  tech: { icon: FaLightbulb, title: 'Технологічний стек та інновації' },
  team: { icon: FaUsers, title: 'Наша команда' }
};

const FEATURES = [
  { icon: FaDatabase, title: 'База даних', text: 'Найбільша база даних про райони міст України з регулярними оновленнями' },
  { icon: FaChartLine, title: 'Глибокий аналіз', text: 'Понад 50 параметрів для оцінки: від екології до інфраструктури' },
  { icon: FaUsers, title: 'Спільнота', text: 'Реальні відгуки та рекомендації від мешканців кожного району' },
  { icon: FaShieldAlt, title: 'Надійність', text: 'Перевірені дані з офіційних джерел та модерація контенту' },
  { icon: FaMobile, title: 'Доступність', text: 'Зручний інтерфейс та мобільний додаток для будь-якого пристрою' },
  { icon: FaSync, title: 'Актуальність', text: 'Щоденне оновлення даних та моніторинг змін в містах' }
];

const STEPS = [
  { number: 1, title: 'Вибір міста та критеріїв', text: 'Оберіть місто та вкажіть ваші пріоритети: бюджет, транспортна доступність, наявність шкіл та дитячих садків, екологічна ситуація, інфраструктура' },
  { number: 2, title: 'Збір та аналіз даних', text: 'Наша система автоматично збирає дані з офіційних джерел, соціальних мереж та відгуків користувачів, аналізує їх за допомогою AI' },
  { number: 3, title: 'Візуалізація результатів', text: 'Отримайте інтерактивні карти, детальні звіти та порівняльні таблиці з оцінкою кожного району за вашими критеріями' },
  { number: 4, title: 'Прийняття рішення', text: 'Використовуйте наші рекомендації, відгуки спільноти та детальну аналітику для обґрунтованого вибору ідеального району' }
];

const DATA_SOURCES = [
  {
    title: 'Офіційні джерела:',
    items: [
      'Державна служба статистики України',
      'Міністерство розвитку громад та територій',
      'Місцеві органи влади та адміністрації',
      'Дані про нерухомість та ринкові ціни'
    ]
  },
  {
    title: 'Соціальні дані:',
    items: [
      'Відгуки та рейтинги від реальних мешканців',
      'Соціальні мережі та форуми',
      'Експертні оцінки урбаністів та соціологів'
    ]
  },
  {
    title: 'Технічні дані:',
    items: [
      'GIS системи та геospatial дані',
      'Дані про транспортну доступність',
      'Екологічний моніторинг',
      'Дані про інфраструктурні проекти'
    ]
  }
];

const AUDIENCE = [
  { icon: FaHeart, title: 'Для сімей', text: 'Знайдіть район з хорошими школами, дитячими майданчиками та безпечним середовищем' },
  { icon: FaClock, title: 'Для комутерів', text: 'Оберіть район з зручним транспортним сполученням до роботи' },
  { icon: FaChartLine, title: 'Для інвесторів', text: 'Аналізуйте перспективи розвитку районів та інвестиційний потенціал' },
  { icon: FaGlobe, title: 'Для урбаністів', text: 'Досліджуйте міський простір та тенденції розвитку міст' }
];

const TECHNOLOGIES = [
  { title: 'Frontend:', text: 'React.js, TypeScript, Mapbox GL JS, D3.js для візуалізації' },
  { title: 'Backend:', text: 'Node.js, Python для data science, PostgreSQL з PostGIS' },
  { title: 'AI та аналітика:', text: 'Machine Learning для прогнозування розвитку районів, NLP для аналізу відгуків' },
  { title: 'Інфраструктура:', text: 'AWS, Docker, Kubernetes, CI/CD пайплайни' }
];

export default function About() {
  return (
    <div className={styles.container}>
      <HeroSection />
      <div className={styles.content}>
        <Section type="mission">
          <p><strong>GeoAnalyzer</strong> народився з ідеї створення інструменту, який би допоміг кожному знайти ідеальне місце для життя. Ми віримо, що вибір району - це не просто про географію, а про якість життя, комфорт та безпеку.</p>
          <p>Наша візія - стати найповнішим джерелом інформації про міський простір України, об'єднавши дані з офіційних джерел, відгуки мешканців та експертні оцінки в єдину зрозумілу систему.</p>
        </Section>

        <Section type="features">
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </Section>

        <Section type="process">
          <div className={styles.howItWorks}>
            {STEPS.map((step, index) => (
              <Step key={index} {...step} />
            ))}
          </div>
        </Section>

        <Section type="data">
          <div className={styles.dataSources}>
            {DATA_SOURCES.map((source, index) => (
              <SourceCategory key={index} {...source} />
            ))}
          </div>
        </Section>

        <Section type="audience">
          <div className={styles.targetAudience}>
            {AUDIENCE.map((group, index) => (
              <AudienceGroup key={index} {...group} />
            ))}
          </div>
        </Section>

        <Section type="tech">
          <div className={styles.technologies}>
            {TECHNOLOGIES.map((tech, index) => (
              <TechCategory key={index} {...tech} />
            ))}
          </div>
        </Section>

        <Section type="team">
          <div className={styles.team}>
            <p>Ми - міждисциплінарна команда з 15+ фахівців, що об'єднує:</p>
            <ul>
              <li><strong>Розробників ПЗ</strong> з досвідом роботи у великих tech компаніях</li>
              <li><strong>Data scientist</strong> з фахом у урбаністиці та соціології</li>
              <li><strong>Географів та картографів</strong> з знанням GIS систем</li>
              <li><strong>Дизайнерів</strong> що створюють зручний користувацький досвід</li>
              <li><strong>Експертів</strong> з нерухомості та міського планування</li>
            </ul>
            <p>Наша місія - робити міста України зрозумілішими та доступнішими для кожного.</p>
          </div>
        </Section>

        <CTASection />
      </div>
    </div>
  );
}

// Допоміжні компоненти
const HeroSection = () => (
  <div className={styles.heroSection}>
    <div className={styles.heroContent}>
      <h1 className={styles.heroTitle}>Про проект GeoAnalyzer</h1>
      <p className={styles.heroSubtitle}>Інноваційна платформа для комплексного аналізу та порівняння районів міст</p>
      <div className={styles.heroStats}>
        {[
          { number: '50+', label: 'міст України' },
          { number: '1000+', label: 'районів' },
          { number: '25k+', label: 'користувачів' }
        ].map((stat, index) => (
          <div key={index} className={styles.stat}>
            <span className={styles.statNumber}>{stat.number}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Section = ({ type, children }) => {
  const { icon: Icon, title } = SECTION_CONFIG[type];
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon className={styles.sectionIcon} />
        <h2>{title}</h2>
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, text }) => (
  <div className={styles.featureCard}>
    <Icon className={styles.featureIcon} />
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const Step = ({ number, title, text }) => (
  <div className={styles.step}>
    <div className={styles.stepNumber}>{number}</div>
    <div className={styles.stepContent}>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  </div>
);

const SourceCategory = ({ title, items }) => (
  <div className={styles.sourceCategory}>
    <h3>{title}</h3>
    <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
  </div>
);

const AudienceGroup = ({ icon: Icon, title, text }) => (
  <div className={styles.audienceGroup}>
    <Icon className={styles.audienceIcon} />
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const TechCategory = ({ title, text }) => (
  <div className={styles.techCategory}>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const CTASection = () => (
  <section className={styles.ctaSection}>
    <h2>Готові відкрити нові можливости?</h2>
    <p>Приєднуйтесь до тисяч користувачів, які вже знайшли свій ідеальний район</p>
    <div className={styles.ctaButtons}>
      {[
        { to: "/", label: "Почати аналіз", type: "primary" },
        { to: "/subscription", label: "Дізнатись про підписку", type: "secondary" },
        { to: "/contacts", label: "Зв'язатись з нами", type: "tertiary" }
      ].map((button, index) => (
        <Link key={index} to={button.to} className={styles[`ctaButton${button.type.charAt(0).toUpperCase() + button.type.slice(1)}`]}>
          {button.label}
        </Link>
      ))}
    </div>
  </section>
);