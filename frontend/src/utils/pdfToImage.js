import * as pdfjsLib from 'pdfjs-dist';

// Define worker source to be loaded locally via Vite
import pdfWorkerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerURL;

/**
 * Extracts the first page of a PDF file and converts it to a PNG Blob.
 * 
 * @param {File} file - The PDF file object from an input element.
 * @returns {Promise<Blob>} A promise that resolves to the PNG Blob.
 */
export const extractFirstPageAsImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        const typedarray = new Uint8Array(e.target.result);
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        
        // Fetch the first page
        const pageNumber = 1;
        const page = await pdf.getPage(pageNumber);
        
        // Higher scale yields higher resolution image, which is better for OMR accuracy
        const scale = 2.0; 
        const viewport = page.getViewport({ scale: scale });
        
        // Prepare a hidden canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the PDF page into the canvas context
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;
        
        // Convert canvas to a PNG Blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        }, 'image/png');
        
      } catch (err) {
        console.error('Error processing PDF:', err);
        reject(err);
      }
    };
    
    reader.onerror = (err) => {
      console.error('Error reading file:', err);
      reject(err);
    };
    
    // Start reading the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
};
