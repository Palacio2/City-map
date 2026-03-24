import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export const useDBTranslations = () => {
    const { i18n } = useTranslation();

    const { data: translations } = useQuery({
        queryKey: ['dbTranslations'],
        queryFn: api.translations.getAll,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        if (translations && translations.length > 0) {
            translations.forEach(({ translation_key, uk, pl, en }) => {
                if (uk) i18n.addResource('uk', 'translation', translation_key, uk);
                if (pl) i18n.addResource('pl', 'translation', translation_key, pl);
                if (en) i18n.addResource('en', 'translation', translation_key, en);
            });
        }
    }, [translations, i18n]);

    return { isLoaded: !!translations };
};