import { jsPDF } from 'jspdf';
import type { StoreProduct } from '../types/store-product';
import type { CustomizationState } from '../components/ProductCustomizer';
import { formatGBP, VAT_RATE } from './pricing';

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateDigitalProof = async (
  product: StoreProduct,
  customization: CustomizationState,
  quantity: number,
  unitPrice: number,
  colourName?: string
) => {
  // A4 size: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Fonts
  doc.setFont('helvetica');

  // 1. Header
  try {
    const logoBase64 = await fetchImageAsBase64('/images/logo/abbeygate-logo.png');
    // abbeygate logo is relatively wide. Let's place it top-left
    doc.addImage(logoBase64, 'PNG', 20, 15, 40, 12);
  } catch (error) {
    console.error('Failed to load Abbeygate logo for PDF', error);
  }

  // Tagline
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Bespoke leather manufacturers of diaries, notebooks & accessories', 20, 32);

  // "DIGITAL PROOF" label
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('DIGITAL PROOF', 190, 20, { align: 'right' });

  // Line separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(20, 36, 190, 36);

  // 2. Product Name & Description
  doc.setFontSize(18);
  doc.setTextColor(50, 20, 80); // Dark purple theme color
  doc.setFont('helvetica', 'bold');
  doc.text(product.name, 20, 48);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  // Combine some short details.
  const details = product.categories.map(c => c.name).join(' · ');
  doc.text(details, 20, 54);

  // 3. Main Product Image (Left side)
  if (customization.fullPreviewUrl) {
    try {
      // 80x80 box for the image, approx center-left
      doc.addImage(customization.fullPreviewUrl, 'PNG', 20, 65, 90, 90);
    } catch (error) {
      console.error('Failed to add preview image to PDF', error);
    }
  }

  // 4. Specification Block (Right side)
  const specStartX = 130;
  let specY = 65;

  doc.setFontSize(10);
  doc.setTextColor(50, 20, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('SPECIFICATION', specStartX, specY);
  specY += 8;

  const addSpecRow = (label: string, value: string) => {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), specStartX, specY);
    specY += 4;
    
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(value, specStartX, specY);
    specY += 8;
  };

  if (colourName && colourName.trim()) {
    addSpecRow('Colour', colourName.trim());
  }
  addSpecRow('SKU', product.sku || 'N/A');
  addSpecRow('Branding', customization.blockingType === 'Embossed' ? 'Blind debossed' : customization.blockingType);
  if (customization.blockingType === 'Foil blocked' && customization.foilColor) {
    addSpecRow('Foil Colour', customization.foilColor);
  }
  
  const posLabel = customization.logoPosition?.label || 'Center';
  addSpecRow('Position', posLabel.charAt(0).toUpperCase() + posLabel.slice(1).replace('-', ' '));

  addSpecRow('Corner Edges', customization.cornerEdges);

  // Note: Ribbon color and Elastic color are specifically excluded as per instructions since they aren't in the data model yet.

  // 5. Line separator for pricing
  const pricingY = 175;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(20, pricingY, 190, pricingY);

  // 6. Pricing Block
  let priceY = pricingY + 10;
  doc.setFontSize(10);
  doc.setTextColor(50, 20, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICING', 20, priceY);
  priceY += 8;

  const addPriceRow = (label: string, value: string, isBold: boolean = false) => {
    doc.setFontSize(9);
    if (isBold) {
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(label, 20, priceY);
    doc.text(value, 190, priceY, { align: 'right' });
    priceY += 6;
  };

  const subtotal = quantity * unitPrice;
  const total = subtotal * (1 + VAT_RATE);

  addPriceRow('Quantity', quantity.toString());
  addPriceRow('Unit price (ex VAT)', formatGBP(unitPrice));
  addPriceRow('Subtotal (ex VAT)', formatGBP(subtotal), true);
  addPriceRow('Total (incl. VAT 20%)', formatGBP(total), true);

  // 7. Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('en-GB');
  doc.text('Generated ' + dateStr + ' — for visual approval only. Actual colours may vary slightly from screen.', 20, 280);

  // Return the PDF as an ArrayBuffer
  return doc.output('arraybuffer');
};
