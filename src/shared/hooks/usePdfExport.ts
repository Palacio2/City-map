import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToPDF } from '@/shared/utils/pdfExport';

export const usePdfExport = (fileNamePrefix?: string) => {
  const { t } = useTranslation('db');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const downloadPdf = useCallback(async (elementId: string) => {
    setIsDownloading(true);

    try {
      const prefix = fileNamePrefix || t('district.pdf.default_filename');
      const filename = `${prefix}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      const success = await exportToPDF(elementId, prefix, filename);
      if (!success) {
        console.error(t('district.errors.pdf_export'));
      }
    } catch (error) {
      console.error(t('district.errors.pdf_export'), error);
    } finally {
      setIsDownloading(false);
    }
  }, [fileNamePrefix, t]);

  return { isDownloading, downloadPdf };
};