import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { publicConfigApi } from '@admin/core/api/publicConfigApi';
import { adminQueryKeys } from '@admin/core/api/adminQueryKeys';

export const useDBTranslations = () => {
    const { i18n } = useTranslation();

    const { data: translations, isLoading } = useQuery({
        queryKey: adminQueryKeys.translations,
        queryFn: publicConfigApi.getAllTranslations,
        staleTime: 10 * 60 * 1000, // Кешуємо на 10 хвилин
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        if (!translations || translations.length === 0) return;

        // Групуємо переклади в бандли, щоб не викликати addResource на кожен ключ
        const bundles: Record<string, Record<string, string>> = { uk: {}, pl: {}, en: {} };

        (translations as { translation_key: string, uk?: string, pl?: string, en?: string }[]).forEach(({ translation_key, uk, pl, en }) => {
            if (uk) bundles.uk[translation_key] = uk;
            if (pl) bundles.pl[translation_key] = pl;
            if (en) bundles.en[translation_key] = en;
        });

        // Додаємо ресурси оптом. Параметри: (lng, ns, resources, deep, overwrite)
        Object.keys(bundles).forEach(lang => {
            if (Object.keys(bundles[lang]).length > 0) {
                i18n.addResourceBundle(lang, 'db', bundles[lang], true, true);
            }
        });

    }, [translations, i18n]);

    // Повертаємо стан, щоб App.jsx міг показати Loader поки переклади їдуть з БД
    return { 
        isLoaded: !!translations && !isLoading,
        isLoading 
    };
};
