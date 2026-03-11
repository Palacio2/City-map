import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaChartLine, FaUsers, FaRocket, FaLightbulb, FaShieldAlt,
  FaDatabase, FaMobile, FaMapMarkedAlt, FaHeart, FaCity
} from 'react-icons/fa';
import styles from './About.module.css';
import SeoMeta from '@components/seo/SeoMeta';

const HeroSection = ({ t }) => (
  <div className={styles.heroSection}>
    <div className={styles.heroContent}>
      <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
      <p className={styles.heroSubtitle}>{t('hero.subtitle')}</p>
    </div>
  </div>
);

const Section = ({ config, children }) => {
  const Icon = config.icon;
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon className={styles.sectionIcon} />
        <h2>{config.title}</h2>
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
    <ul>{items.map((item) => <li key={`source-item-${item}`}>{item}</li>)}</ul>
  </div>
);

const AudienceGroup = ({ icon: Icon, title, text }) => (
  <div className={styles.audienceGroup}>
    <Icon className={styles.audienceIcon} />
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
      ].map((button) => (
        <Link 
            key={`cta-btn-${button.to}`} 
            to={button.to} 
            className={`${styles.ctaButton} ${styles[button.type]}`}
        >
          {button.label}
        </Link>
      ))}
    </div>
  </section>
);

export default function About() {
  const { t } = useTranslation('about');

  const sectionConfig = useMemo(() => ({
    mission: { icon: FaRocket, title: t('sections.mission') },
    features: { icon: FaLightbulb, title: t('sections.features') },
    process: { icon: FaMapMarkedAlt, title: t('sections.process') },
    data: { icon: FaDatabase, title: t('sections.data') },
    audience: { icon: FaUsers, title: t('sections.audience') }
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

  return (
    <div className={styles.container}>
      <SeoMeta 
        title={t('seo.title')} 
        description={t('seo.desc')} 
      />

      <HeroSection t={t} />
      <div className={styles.content}>
        
        <Section config={sectionConfig.mission}>
          <p><strong>GeoAnalyzer</strong> — {t('mission.text_1')}</p>
          <p>{t('mission.text_2')}</p>
        </Section>

        <Section config={sectionConfig.features}>
          <div className={styles.featuresGrid}>
            {featuresList.map((feature) => (
              <FeatureCard key={`feature-${feature.title}`} {...feature} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.process}>
          <div className={styles.howItWorks}>
            {stepsList.map((step) => (
              <Step key={`step-${step.number}`} {...step} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.data}>
          <div className={styles.dataSources}>
            {dataSourcesList.map((source) => (
              <SourceCategory key={`source-${source.title}`} {...source} />
            ))}
          </div>
        </Section>

        <Section config={sectionConfig.audience}>
          <div className={styles.targetAudience}>
            {audienceList.map((group) => (
              <AudienceGroup key={`audience-${group.title}`} {...group} />
            ))}
          </div>
        </Section>

        <CTASection t={t} />
      </div>
    </div>
  );
}