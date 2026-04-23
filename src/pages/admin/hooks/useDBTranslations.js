import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export const useDBTranslations = () => {
    const { i18n } = useTranslation();

    const { data: translations, isLoading } = useQuery({
        queryKey: ['dbTranslations'],
        queryFn: api.translations.getAll,
        staleTime: 10 * 60 * 1000, // Кешуємо на 10 хвилин
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        if (!translations || translations.length === 0) return;

        // Групуємо переклади в бандли, щоб не викликати addResource на кожен ключ
        const bundles = { uk: {}, pl: {}, en: {} };

        translations.forEach(({ translation_key, uk, pl, en }) => {
            if (uk) bundles.uk[translation_key] = uk;
            if (pl) bundles.pl[translation_key] = pl;
            if (en) bundles.en[translation_key] = en;
        });

        // Додаємо ресурси оптом. Параметри: (lng, ns, resources, deep, overwrite)
        Object.keys(bundles).forEach(lang => {
            if (Object.keys(bundles[lang]).length > 0) {
                i18n.addResourceBundle(lang, 'translation', bundles[lang], true, true);
            }
        });

    }, [translations, i18n]);

    // Повертаємо стан, щоб App.jsx міг показати Loader поки переклади їдуть з БД
    return { 
        isLoaded: !!translations && !isLoading,
        isLoading 
    };
};