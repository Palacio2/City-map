import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaChartLine, FaUsers, FaRocket, FaLightbulb, FaShieldAlt,
  FaDatabase, FaMobile, FaMapMarkedAlt, FaHeart, FaCity, FaCheckCircle, FaArrowRight
} from 'react-icons/fa';
import SeoMeta from '@components/seo/SeoMeta';

// Хелпер для безпечного парсингу JSON (щоб не повторювати try/catch)
const safeParse = (data, defaultVal) => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return defaultVal; }
  }
  return data || defaultVal;
};

export default function About() {
  const { t } = useTranslation('db');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Витягуємо та парсимо дані з БД
  const seo = safeParse(t('about.seo', { returnObjects: true }), {});
  const hero = safeParse(t('about.hero', { returnObjects: true }), {});
  const sectionsData = safeParse(t('about.sections', { returnObjects: true }), {});
  const mission = safeParse(t('about.mission', { returnObjects: true }), {});
  const cta = safeParse(t('about.cta', { returnObjects: true }), {});
  
  const rawFeatures = safeParse(t('about.features', { returnObjects: true }), []);
  const rawProcess = safeParse(t('about.process', { returnObjects: true }), []);
  const dataSources = safeParse(t('about.data_sources', { returnObjects: true }), []);
  const rawAudience = safeParse(t('about.audience', { returnObjects: true }), []);

  // Мапимо іконки до масивів
  const features = Array.isArray(rawFeatures) ? rawFeatures.map((item, i) => ({
    ...item, 
    icon: [FaHeart, FaMobile, FaShieldAlt, FaCity, FaChartLine, FaDatabase][i] || FaLightbulb
  })) : [];

  const processSteps = Array.isArray(rawProcess) ? rawProcess : [];

  const audience = Array.isArray(rawAudience) ? rawAudience.map((item, i) => ({
    ...item,
    icon: [FaUsers, FaChartLine, FaLightbulb, FaCity][i] || FaUsers
  })) : [];

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden flex flex-col items-center">
      <SeoMeta title={seo.title} description={seo.desc} />

      {/* Фонові градієнти */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/15 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-textMain/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto animate-slideUp">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-textMain to-textSecondary pb-2">
          {hero.title}
        </h1>
        <p className="text-xl md:text-2xl text-textSecondary font-light leading-relaxed max-w-3xl mx-auto">
          {hero.subtitle}
        </p>
      </section>

      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24 relative z-10">
        
        {/* MISSION */}
        <section className="ui-glass-panel p-8 md:p-14 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent shadow-sm">
              <FaRocket className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.mission}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 text-lg text-textSecondary leading-relaxed">
            <p className="font-medium text-textMain"><strong className="text-accent text-xl mr-1">GeoAnalyzer</strong> — {mission.text_1}</p>
            <p>{mission.text_2}</p>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section>
          <div className="flex items-center gap-4 mb-10 justify-center">
            <FaLightbulb className="text-2xl text-accent" />
            <h2 className="ui-heading-2 !mb-0 text-center">{sectionsData.features}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="ui-glass-panel p-8 hover:-translate-y-2 transition-transform duration-300 group">
                  <div className="w-14 h-14 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent mb-6 shadow-sm group-hover:border-accent transition-colors">
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="font-heading font-bold text-xl text-textMain mb-3">{feature.title}</h3>
                  <p className="text-textSecondary leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section className="ui-glass-panel p-8 md:p-14">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent shadow-sm">
              <FaMapMarkedAlt className="text-xl" />
            </div>
            <h2 className="ui-heading-2 !mb-0">{sectionsData.process}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            <div className="hidden lg:block absolute top-6 left-12 right-12 h-0.5 bg-borderClient" />
            {processSteps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-full bg-main border-4 border-surface shadow-md flex items-center justify-center font-heading font-black text-lg text-accent mb-6 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <h3 className="font-heading font-bold text-lg text-textMain mb-3">{step.title}</h3>
                <p className="text-sm text-textSecondary leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DATA SOURCES */}
        <section>
          <div className="flex items-center gap-4 mb-10 justify-center">
            <FaDatabase className="text-2xl text-accent" />
            <h2 className="ui-heading-2 !mb-0 text-center">{sectionsData.data}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dataSources.map((source, i) => (
              <div key={i} className="ui-glass-panel p-8">
                <h3 className="font-heading font-bold text-xl text-textMain mb-6 pb-4 border-b border-borderClient">
                  {source.title}
                </h3>
                <ul className="space-y-4">
                  {source.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-textSecondary">
                      <FaCheckCircle className="text-accent mt-1 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AUDIENCE */}
        <section>
          <div className="flex items-center gap-4 mb-10 justify-center">
            <FaUsers className="text-2xl text-accent" />
            <h2 className="ui-heading-2 !mb-0 text-center">{sectionsData.audience}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {audience.map((group, i) => {
              const Icon = group.icon;
              return (
                <div key={i} className="flex gap-6 ui-glass-panel p-8 hover:border-accent/50 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-surface border border-borderClient flex items-center justify-center text-accent shrink-0 shadow-sm">
                    <Icon className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-textMain mb-2">{group.title}</h3>
                    <p className="text-textSecondary leading-relaxed">{group.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* CTA SECTION */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#0f1014] p-10 md:p-16 text-center shadow-2xl mt-16">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-transparent opacity-50 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Явно вказуємо text-white, щоб перебити глобальні стилі */}
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-white">
              {cta.title}
            </h2>
            <p className="text-lg text-white/80 mb-10">
              {cta.text}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-white font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 hover:-translate-y-1 shadow-lg shadow-accent/20">
                {cta.map_btn} <FaArrowRight />
              </Link>
              <Link to="/subscription" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border border-white/30 text-white hover:bg-white/10 font-bold transition-all hover:-translate-y-1">
                {cta.plans_btn}
              </Link>
              <Link to="/contacts" className="w-full sm:w-auto px-6 py-4 text-white/70 hover:text-white font-semibold underline-offset-4 hover:underline transition-all">
                {cta.support_btn}
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}