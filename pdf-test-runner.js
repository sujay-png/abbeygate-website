const fs = require('fs');
const pdfParse = require('pdf-parse');
const { jsPDF } = require('jspdf');

async function testPDF() {
  const doc = new jsPDF();
  doc.setFontSize(24);
  doc.text('Dorchester A5 Notebook', 20, 20);
  doc.setFontSize(10);
  doc.text('SKUNH-BK-U-31-E-P', 20, 30);
  doc.text('BrandingFoil blocked', 20, 40);
  
  const arrayBuffer = doc.output('arraybuffer');
  
  const data = await pdfParse(Buffer.from(arrayBuffer));
  console.log("PDF TEXT: ", data.text);
  
  if (data.text.includes('Dorchester A5 Notebook')) {
    console.log("SUCCESS");
  } else {
    console.log("FAILURE");
  }
}

testPDF();
