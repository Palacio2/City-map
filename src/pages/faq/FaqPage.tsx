import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  FaChevronDown, FaQuestionCircle, FaEnvelope,
  FaLayerGroup, FaCreditCard, FaDatabase, FaUser
} from 'react-icons/fa';
import SeoMeta from '@seo/SeoMeta';

interface FaqItem {
  q: string;
  a: string;
}

import { safeParse } from '@/shared/utils/jsonParser';

export default function FaqPage() {
  const { t } = useTranslation('db');
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = [
    { id: 'general', icon: <FaLayerGroup /> },
    { id: 'subscription', icon: <FaCreditCard /> },
    { id: 'data', icon: <FaDatabase /> },
    { id: 'account', icon: <FaUser /> }
  ];

  const rawQuestions = t(`faq.questions.${activeCategory}`, { returnObjects: true });

  const questions = useMemo<FaqItem[]>(() => {
    const parsed = safeParse<FaqItem[]>(rawQuestions, []);
    return Array.isArray(parsed) ? parsed : [];
  }, [rawQuestions]);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-32 pb-12 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-body">
      <SeoMeta
        title={t('faq.seo.title')}
        description={t('faq.seo.desc')}
      />

      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none -z-10 hidden sm:block" />
      <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-textMain/5 blur-[150px] rounded-full pointer-events-none -z-10 hidden sm:block" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-16 animate-slide-up-fade">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-surface border border-borderClient shadow-xs text-accent mb-4 sm:mb-8 relative group">
            <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 hidden sm:block" />
            <FaQuestionCircle className="text-xl sm:text-4xl relative z-10" />
          </div>
          <h1 className="font-heading font-bold text-[1.5rem] sm:text-[2.5rem] leading-tight mb-2 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-br from-textMain to-textSecondary">
            {t('faq.title')}
          </h1>
          <p className="text-textSecondary text-[0.9rem] sm:text-xl leading-relaxed px-4">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 lg:gap-16">
          <aside className="lg:w-1/4 shrink-0 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <div className="sticky top-20 sm:top-32 flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-none [&::-webkit-scrollbar]:hidden snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setOpenIndex(null);
                    }}
                    className={`flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-5 rounded-full lg:rounded-[24px] font-bold text-[13px] sm:text-base transition-all duration-300 whitespace-nowrap lg:whitespace-normal snap-start shrink-0
                      ${isActive
                        ? 'bg-textMain text-surface shadow-md lg:shadow-[0_10px_30px_rgba(0,0,0,0.1)] scale-100'
                        : 'bg-surface text-textSecondary border border-borderClient hover:border-accent hover:text-textMain hover:scale-[1.02]'
                      }`}
                  >
                    <span className={`text-[15px] sm:text-xl ${isActive ? 'text-surface' : 'text-accent'}`}>
                      {cat.icon}
                    </span>
                    {t(`faq.categories.${cat.id}`)}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="lg:w-3/4 flex flex-col gap-3 sm:gap-5 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
            {questions.length > 0 ? (
              questions.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`ui-glass-panel overflow-hidden transition-all duration-300 rounded-2xl sm:rounded-3xl ${isOpen ? 'border-accent shadow-xs sm:shadow-md' : 'hover:border-textSecondary/30'}`}
                  >
                    <button
                      className="w-full flex justify-between items-center text-left p-4 sm:p-8 cursor-pointer group gap-3 sm:gap-4"
                      onClick={() => toggleQuestion(index)}
                    >
                      <span className={`font-heading font-bold text-[0.95rem] sm:text-[1.35rem] leading-snug transition-colors duration-300 ${isOpen ? 'text-accent' : 'text-textMain group-hover:text-accent'}`}>
                        {item.q}
                      </span>
                      <span className={`shrink-0 flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-full sm:border-2 transition-all duration-300 ${isOpen ? 'bg-accent sm:border-accent text-white rotate-180' : 'bg-body sm:bg-transparent sm:border-borderClient text-textSecondary group-hover:sm:border-accent group-hover:text-accent'}`}>
                        <FaChevronDown className="text-[10px] sm:text-base" />
                      </span>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-4 px-4 sm:pb-8 sm:px-8 text-[0.9rem] sm:text-lg leading-relaxed text-textSecondary border-t border-borderClient/50 mt-1 sm:mt-2 mx-4 sm:mx-8 pt-4 sm:pt-6">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ui-glass-panel p-6 sm:p-12 text-center text-textSecondary font-medium text-[0.9rem] sm:text-lg border-dashed rounded-2xl sm:rounded-3xl">
                {t('faq.no_questions_found')}
              </div>
            )}

            <div className="mt-4 sm:mt-16 ui-glass-panel p-6 sm:p-14 text-center relative overflow-hidden group rounded-2xl sm:rounded-[2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:block" />
              <h3 className="font-heading font-bold mb-4 sm:mb-8 relative z-10 text-textMain text-[1.1rem] sm:text-[2rem]">
                {t('faq.still_have_questions')}
              </h3>
              <Link
                to="/contacts"
                className="relative z-10 w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-4 px-6 sm:px-10 bg-textMain text-surface rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest font-heading transition-all shadow-md hover:bg-accent hover:-translate-y-0.5 hover:shadow-lg text-[11px] sm:text-base whitespace-nowrap"
              >
                <FaEnvelope className="text-sm sm:text-xl" />
                <span>{t('faq.contact_support')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}