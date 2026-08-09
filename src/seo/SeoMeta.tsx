import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SeoMetaProps {
  readonly title: string;
  readonly description: string;
}

export default function SeoMeta({ title, description }: SeoMetaProps) {
  const { i18n } = useTranslation();
  return (
    <Helmet>
      <html lang={i18n.language || 'uk'} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}