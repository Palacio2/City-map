import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const usePdfExport = (fileNamePrefix: string = 'zvit') => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const downloadPdf = useCallback(async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();

      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;

      let heightLeft = pdfImgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, pdfImgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, pdfImgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Помилка експорту:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [fileNamePrefix]);

  return { isDownloading, downloadPdf };
};