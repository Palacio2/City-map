import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  FaChevronDown, FaQuestionCircle, FaEnvelope,
  FaLayerGroup, FaCreditCard, FaDatabase, FaUser
} from 'react-icons/fa';
import SeoMeta from '@components/seo/SeoMeta';

export default function FaqPage() {
  const { t } = useTranslation('db');
  const [activeCategory, setActiveCategory] = useState('general');
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
  
  const questions = useMemo(() => {
    if (typeof rawQuestions === 'string') {
      try {
        return JSON.parse(rawQuestions);
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(rawQuestions) ? rawQuestions : [];
  }, [rawQuestions]);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <SeoMeta 
        title={t('faq.seo.title')} 
        description={t('faq.seo.desc')} 
      />

      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-textMain/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-slideUp">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface border border-borderClient shadow-sm text-accent mb-8 relative group">
            <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <FaQuestionCircle className="text-4xl relative z-10" />
          </div>
          
          <h1 className="ui-heading-1 mb-6 text-transparent bg-clip-text bg-gradient-to-br from-textMain to-textSecondary">
            {t('faq.title')}
          </h1>
          <p className="ui-text-muted text-xl">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <aside className="lg:w-1/4 shrink-0 animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div className="sticky top-32 flex lg:flex-col gap-3 overflow-x-auto pb-4 lg:pb-0 scrollbar-none snap-x">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setOpenIndex(null);
                    }}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 whitespace-nowrap lg:whitespace-normal snap-start
                      ${isActive 
                        ? 'bg-textMain text-surface shadow-lg scale-100' 
                        : 'bg-surface text-textSecondary border border-borderClient hover:border-accent hover:text-textMain hover:scale-[1.02]'
                      }`}
                  >
                    <span className={`text-xl ${isActive ? 'text-surface' : 'text-accent'}`}>
                      {cat.icon}
                    </span>
                    {t(`faq.categories.${cat.id}`)}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="lg:w-3/4 flex flex-col gap-5 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            {questions.length > 0 ? (
              questions.map((item: any, index: number) => {
                const isOpen = openIndex === index;
                return (
                  <div 
                    key={index} 
                    className={`ui-glass-panel overflow-hidden transition-all duration-300 ${isOpen ? 'border-accent shadow-md' : 'hover:border-textSecondary/30'}`}
                  >
                    <button 
                      className="w-full flex justify-between items-center text-left p-6 sm:p-8 cursor-pointer group"
                      onClick={() => toggleQuestion(index)}
                    >
                      <span className={`font-heading font-bold text-xl sm:text-2xl transition-colors duration-300 pr-8 ${isOpen ? 'text-accent' : 'text-textMain group-hover:text-accent'}`}>
                        {item.q}
                      </span>
                      <span className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 ${isOpen ? 'bg-accent border-accent text-white rotate-180' : 'bg-transparent border-borderClient text-textSecondary group-hover:border-accent group-hover:text-accent'}`}>
                        <FaChevronDown />
                      </span>
                    </button>
                    
                    <div 
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-6 px-6 sm:pb-8 sm:px-8 text-lg leading-relaxed text-textSecondary border-t border-borderClient/50 mt-2 mx-6 sm:mx-8 pt-6">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ui-glass-panel p-12 text-center text-textSecondary font-medium text-lg border-dashed">
                {t('faq.no_questions_found')}
              </div>
            )}

            <div className="mt-16 ui-glass-panel p-10 sm:p-14 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h3 className="ui-heading-2 mb-8 relative z-10">
                {t('faq.still_have_questions')}
              </h3>
              <Link 
                to="/contacts" 
                className="ui-button-primary relative z-10 w-full sm:w-auto inline-flex"
              >
                <FaEnvelope className="text-xl" />
                <span>{t('faq.contact_support')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}