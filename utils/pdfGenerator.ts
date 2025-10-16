// This file relies on global scripts loaded in index.html for jspdf and html2canvas.
// We declare them here to satisfy TypeScript.
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

export const generatePdf = async (element: HTMLElement): Promise<void> => {
  if (!element) {
    console.error("PDF generation failed: provided element is null.");
    return;
  }

  // Check if the required libraries are loaded on the window object
  if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    console.error("PDF generation failed: html2canvas or jspdf library not found or not correctly loaded.");
    // Provide user-friendly feedback
    alert("Sorry, there was a problem loading the PDF generation library. Please try refreshing the page.");
    return;
  }

  // Temporarily change the background for the PDF capture to look better
  const originalBg = element.style.backgroundColor;
  element.style.backgroundColor = '#262626'; // A neutral dark color for the PDF background
  
  // A small delay to ensure any transitions (like the detailed report) are complete
  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    const canvas = await window.html2canvas(element, {
      scale: 2, // Improve image quality
      useCORS: true,
      backgroundColor: '#262626',
      logging: false,
    });

    // Restore original background color after capture
    element.style.backgroundColor = originalBg;

    const imgData = canvas.toDataURL('image/png');
    // Explicitly use the jsPDF constructor from the window object
    const { jsPDF } = window.jspdf;
    
    // PDF dimensions based on A4, aspect ratio from canvas
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Fibonacci-Face-Analysis.pdf');
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Restore original background color in case of error
    element.style.backgroundColor = originalBg;
    // Provide user-friendly feedback on error
    alert("An error occurred while generating the PDF report. Please try again.");
  }
};