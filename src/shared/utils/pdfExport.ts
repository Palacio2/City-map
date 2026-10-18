import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId: string, _title = 'Report', fileName = 'report.pdf'): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pages = element.querySelectorAll('.pdf-page');
    
    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgWidth = pdfWidth; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }
    } else {
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, 
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgWidth = pdfWidth; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    return false;
  }
};
