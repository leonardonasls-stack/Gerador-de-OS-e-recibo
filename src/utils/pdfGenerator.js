import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

export const generateOSPDF = async (osNumber, clientName) => {
  const wrapper = document.getElementById('print-wrapper');
  const element = document.getElementById('os-preview-container');
  
  if (!wrapper || !element) {
    throw new Error('Elemento da OS não encontrado para gerar o PDF.');
  }

  // Save original style to restore later
  const originalStyle = wrapper.style.cssText;

  // Temporarily show the wrapper and force A4 width so mobile devices don't distort it
  wrapper.classList.remove('hidden');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '-9999px'; // Hide off-screen
  wrapper.style.width = '794px'; // A4 width at 96 DPI
  wrapper.style.height = 'auto';
  wrapper.style.minHeight = '1123px'; // A4 height at 96 DPI

  try {
    const scale = 2; // Improve resolution
    // Wait a brief moment to ensure browser has reflowed layout
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const targetWidth = element.clientWidth || 794;
    const targetHeight = element.clientHeight || 1123;

    const dataUrl = await domtoimage.toPng(element, {
      quality: 0.98,
      bgcolor: '#ffffff',
      width: targetWidth * scale,
      height: targetHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${targetWidth}px`,
        height: `${targetHeight}px`
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
    wrapper.style.cssText = originalStyle;
    wrapper.classList.add('hidden');
  }
};
