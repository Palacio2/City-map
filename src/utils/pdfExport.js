import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId, _title = 'Report', fileName = 'report.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return false;

  const isDistrictAnalytics = elementId === 'district-pdf-container';

  try {
    if (isDistrictAnalytics) {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      await pdf.html(element, {
        callback: function (doc) {
          doc.save(fileName);
        },
        margin: [15, 0, 15, 0],
        autoPaging: 'text',
        x: 0,
        y: 0,
        width: 210,
        windowWidth: 794,
        html2canvas: {
          useCORS: true,
          scale: 2,
          logging: false
        }
      });

      return true;
    } else {
      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, 
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(fileName);
      return true;
    }
  } catch (error) {
    console.error('PDF Export Error:', error);
    return false;
  }
};