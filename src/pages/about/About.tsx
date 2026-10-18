import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaChartLine, FaUsers, FaRocket, FaLightbulb, FaShieldAlt,
  FaDatabase, FaMobile, FaMapMarkedAlt, FaHeart, FaCity, FaCheckCircle, FaArrowRight
} from 'react-icons/fa';
import type { IconType } from 'react-icons';
import SeoMeta from '@seo/SeoMeta';

interface DataSource {
  title: string;
  items: string[];
}

interface TextSection {
  title: string;
  text: string;
}

interface FeatureItem extends TextSection {
  icon: IconType;
}

import { safeParse } from '@/shared/utils/jsonParser';

export default function About() {
  const { t } = useTranslation('db');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const seo = safeParse<Record<string, string>>(t('about.seo', { returnObjects: true }), {});
  const hero = safeParse<Record<string, string>>(t('about.hero', { returnObjects: true }), {});
  const sectionsData = safeParse<Record<string, string>>(t('about.sections', { returnObjects: true }), {});
  const mission = safeParse<Record<string, string>>(t('about.mission', { returnObjects: true }), {});
  const cta = safeParse<Record<string, string>>(t('about.cta', { returnObjects: true }), {});

  const rawFeatures = safeParse<TextSection[]>(t('about.features', { returnObjects: true }), []);
  const rawProcess = safeParse<TextSection[]>(t('about.process', { returnObjects: true }), []);
  const dataSources = safeParse<DataSource[]>(t('about.data_sources', { returnObjects: true }), []);
  const rawAudience = safeParse<TextSection[]>(t('about.audience', { returnObjects: true }), []);

  const features = useMemo<FeatureItem[]>(() =>
    Array.isArray(rawFeatures) ? rawFeatures.map((item, i) => ({
      ...item,
      icon: [FaHeart, FaMobile, FaShieldAlt, FaCity, FaChartLine, FaDatabase][i] || FaLightbulb
    })) : [], [rawFeatures]);

  const processSteps = Array.isArray(rawProcess) ? rawProcess : [];

  const audience = useMemo<FeatureItem[]>(() =>
    Array.isArray(rawAudience) ? rawAudience.map((item, i) => ({
      ...item,
      icon: [FaUsers, FaChartLine, FaLightbulb, FaCity][i] || FaUsers
    })) : [], [rawAudience]);

  return (
    <div className="min-h-screen pb-16 sm:pb-24 relative overflow-hidden flex flex-col items-center">
      <SeoMeta title={seo.title || ''} description={seo.desc || ''} />
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] sm:w-[800px] sm:h-[500px] bg-accent/10 blur-[120px] sm:blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-accent/5 blur-[120px] sm:blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto animate-slideUp">
        <h1 className="ui-heading-1 !text-5xl sm:!text-6xl lg:!text-7xl !mb-6 text-transparent bg-clip-text bg-gradient-to-br from-textMain to-textSecondary pb-2">
          {hero.title}
        </h1>
        <p className="ui-text-muted !text-xl sm:!text-2xl max-w-3xl mx-auto">
          {hero.subtitle}
        </p>
      </section>

      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 relative z-10">
        
        {/* Mission Section */}
        <section className="ui-glass-panel p-6 sm:p-10 md:p-14 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent shadow-xs shrink-0">
              <FaRocket className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.mission}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-16">
            <p className="ui-text-muted font-medium text-textMain"><strong className="text-accent text-xl mr-1">Kvartal</strong> — {mission.text_1}</p>
            <p className="ui-text-body">{mission.text_2}</p>
          </div>
        </section>

        {/* Features Section */}
        <section>
          <div className="flex flex-col items-center gap-3 mb-8 sm:mb-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-2">
               <FaLightbulb className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.features}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="ui-glass-panel p-6 sm:p-8 hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent mb-5 sm:mb-6 shadow-xs group-hover:border-accent group-hover:bg-accent/5 transition-colors shrink-0">
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="ui-heading-2 !text-xl !mb-3">{feature.title}</h3>
                  <p className="ui-text-body grow !mb-0">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Process Section */}
        <section className="ui-glass-panel p-6 sm:p-10 md:p-14">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 sm:mb-12">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent shadow-xs shrink-0">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.process}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-borderClient" />
            {processSteps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-main border-4 border-surface shadow-md flex items-center justify-center font-heading font-black text-lg sm:text-xl text-accent mb-4 sm:mb-6 group-hover:scale-110 group-hover:border-accent/30 transition-all shrink-0">
                  {i + 1}
                </div>
                <h3 className="ui-heading-2 !text-lg sm:!text-xl !mb-2 sm:!mb-3">{step.title}</h3>
                <p className="ui-text-body text-sm sm:text-base !mb-0">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data Sources Section */}
        <section>
          <div className="flex flex-col items-center gap-3 mb-8 sm:mb-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-2">
               <FaDatabase className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.data}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {dataSources.map((source, i) => (
              <div key={i} className="ui-glass-panel p-6 sm:p-8 flex flex-col h-full">
                <h3 className="ui-heading-2 !text-xl !mb-5 pb-4 border-b border-borderClient">
                  {source.title}
                </h3>
                <ul className="space-y-3 sm:space-y-4 grow">
                  {source.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <FaCheckCircle className="text-accent mt-1 shrink-0 text-lg" />
                      <span className="ui-text-body !mb-0">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Audience Section */}
        <section>
          <div className="flex flex-col items-center gap-3 mb-8 sm:mb-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-2">
               <FaUsers className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.audience}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {audience.map((group, i) => {
              const Icon = group.icon;
              return (
                <div key={i} className="flex flex-col sm:flex-row gap-5 sm:gap-6 ui-glass-panel p-6 sm:p-8 hover:border-accent/40 transition-colors">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent shrink-0 shadow-xs">
                    <Icon className="text-2xl sm:text-3xl" />
                  </div>
                  <div>
                    <h3 className="ui-heading-2 !text-xl !mb-2">{group.title}</h3>
                    <p className="ui-text-body !mb-0">{group.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-surface border border-borderClient p-8 sm:p-12 md:p-16 text-center shadow-card hover:shadow-hover transition-all mt-16 sm:mt-24 group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="ui-heading-1 !text-3xl sm:!text-4xl md:!text-5xl !mb-4">
              {cta.title}
            </h2>
            <p className="ui-text-muted !text-lg sm:!text-xl mb-8 sm:mb-10 max-w-2xl">
              {cta.text}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto">
              <Link to="/" className="ui-button-primary w-full sm:w-auto !px-8 !py-4 shadow-xs">
                {cta.map_btn} <FaArrowRight className="ml-1" />
              </Link>
              <Link to="/subscription" className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-borderClient text-textMain hover:border-accent hover:text-accent font-bold transition-all flex items-center justify-center">
                {cta.plans_btn}
              </Link>
              <Link to="/contacts" className="ui-link mt-2 sm:mt-0 sm:ml-2">
                {cta.support_btn}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}