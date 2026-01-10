import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaChartLine, FaUsers, FaRocket, FaLightbulb, FaShieldAlt,
  FaDatabase, FaMobile, FaMapMarkedAlt, FaHeart, FaCity, FaLaptopCode
} from 'react-icons/fa';
import styles from './About.module.css';

export default function About() {
  const { t } = useTranslation('about');

  const sectionConfig = useMemo(() => ({
    mission: { icon: FaRocket, title: t('sections.mission') },
    features: { icon: FaLightbulb, title: t('sections.features') },
    process: { icon: FaMapMarkedAlt, title: t('sections.process') },
    data: { icon: FaDatabase, title: t('sections.data') },
    audience: { icon: FaUsers, title: t('sections.audience') },
    tech: { icon: FaLaptopCode, title: t('sections.tech') },
    team: { icon: FaUsers, title: t('sections.team') }
  }), [t]);

  const featuresList = useMemo(() => {
    const data = t('features', { returnObjects: true });
    const icons = [FaChartLine, FaDatabase, FaHeart, FaShieldAlt, FaMobile, FaCity];
    return Array.isArray(data) ? data.map((item, i) => ({ ...item, icon: icons[i] || FaLightbulb })) : [];
  }, [t]);

  const stepsList = useMemo(() => {
    const data = t('process', { returnObjects: true });
    return Array.isArray(data) ? data.map((item, i) => ({ ...item, number: i + 1 })) : [];
  }, [t]);

  const dataSourcesList = useMemo(() => {
    const data = t('data_sources', { returnObjects: true });
    return Array.isArray(data) ? data : [];
  }, [t]);

  const audienceList = useMemo(() => {
    const data = t('audience', { returnObjects: true });
    const icons = [FaHeart, FaCity, FaChartLine, FaMapMarkedAlt];
    return Array.isArray(data) ? data.map((item, i) => ({ ...item, icon: icons[i] || FaUsers })) : [];
  }, [t]);

  const technologiesList = useMemo(() => {
    const data = t('tech', { returnObjects: true });
    return Array.isArray(data) ? data : [];
  }, [t]);

  const teamData = useMemo(() => t('team', { returnObjects: true }), [t]);

  return (
    <div className={styles.container}>
      <HeroSection t={t} />
      <div className={styles.content}>
        
        <Section config={sectionConfig.mission}>
          <p><strong>GeoAnalyzer</strong> — {t('mission.text_1')}</p>
          <p>{t('mission.text_2')}</p>
        </Section>

        <Section config={sectionConfig.features}>
          <div className={styles.featuresGrid}>
            {featuresList.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.process}>
          <div className={styles.howItWorks}>
            {stepsList.map((step, index) => (
              <Step key={index} {...step} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.data}>
          <div className={styles.dataSources}>
            {dataSourcesList.map((source, index) => (
              <SourceCategory key={index} {...source} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.audience}>
          <div className={styles.targetAudience}>
            {audienceList.map((group, index) => (
              <AudienceGroup key={index} {...group} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.tech}>
          <div className={styles.technologies}>
            {technologiesList.map((tech, index) => (
              <TechCategory key={index} {...tech} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.team}>
          <div className={styles.team}>
            <p>{teamData.intro}</p>
            <ul>
              {Array.isArray(teamData.list) && teamData.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p>{teamData.outro}</p>
          </div>
        </Section>

        <CTASection t={t} />
      </div>
    </div>
  );
}

/* Sub-components */
const HeroSection = ({ t }) => (
  <div className={styles.heroSection}>
    <div className={styles.heroContent}>
      <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
      <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
      <div className={styles.heroStats}>
        {[
          { number: '6', label: t('hero.stats.categories') },
          { number: '24/7', label: t('hero.stats.access') },
          { number: '100%', label: t('hero.stats.convenience') }
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

const Section = ({ config, children }) => {
  const { icon: Icon, title } = config;
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

const CTASection = ({ t }) => (
  <section className={styles.ctaSection}>
    <h2>{t('cta.title')}</h2>
    <p>{t('cta.text')}</p>
    <div className={styles.ctaButtons}>
      {[
        { to: "/", label: t('cta.map_btn'), type: "primary" },
        { to: "/subscription", label: t('cta.plans_btn'), type: "secondary" },
        { to: "/contacts", label: t('cta.support_btn'), type: "tertiary" }
      ].map((button, index) => (
        <Link 
            key={index} 
            to={button.to} 
            className={`${styles.ctaButton} ${styles[button.type]}`}
        >
          {button.label}
        </Link>
      ))}
    </div>
  </section>
);