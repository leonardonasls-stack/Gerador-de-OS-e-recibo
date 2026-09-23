import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

export const generateOSPDF = async (osNumber, clientName) => {
  const wrapper = document.getElementById('print-wrapper');
  const element = document.getElementById('os-preview-container');
  
  if (!wrapper || !element) {
    throw new Error('Elemento da OS não encontrado para gerar o PDF.');
  }

  // Temporarily show the wrapper so dom-to-image can render it
  wrapper.classList.remove('hidden');

  try {
    const scale = 2; // Improve resolution
    const dataUrl = await domtoimage.toPng(element, {
      quality: 0.98,
      bgcolor: '#ffffff',
      width: element.clientWidth * scale,
      height: element.clientHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${element.clientWidth}px`,
        height: `${element.clientHeight}px`
      }
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Scale image to fit A4
    const imgProps = pdf.getImageProperties(dataUrl);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));

    const filename = `OS_${osNumber?.replace(/\//g, '-')}_${clientName?.trim().replace(/\s+/g, '_') || 'Cliente'}.pdf`;
    
    const pdfBlob = pdf.output('blob');
    return { blob: pdfBlob, filename };
  } catch (error) {
    console.error('Erro ao gerar PDF com dom-to-image:', error);
    throw error;
  } finally {
    wrapper.classList.add('hidden');
  }
};
