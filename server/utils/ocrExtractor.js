const Tesseract = require('tesseract.js');
const { extractStructuredSummary } = require('../services/aiService');

/**
 * Extracts text from a single image URL using tesseract.js.
 * Token-efficient: no image sent to AI.
 */
async function extractTextFromImageUrl(imageUrl) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      { logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`) }
    );
    
    // Clean text by replacing multiple newlines and spaces
    const cleanText = text.replace(/\\n{3,}/g, '\\n\\n').replace(/ {2,}/g, ' ').trim();
    return cleanText;
  } catch (err) {
    console.error(`[OCR Error] Failed to process image ${imageUrl}:`, err.message);
    throw new Error('Unable to extract text. Upload a clearer image.');
  }
}

/**
 * Processes all documents of a product:
 * 1. Extracts text from each image via Tesseract OCR
 * 2. Combines texts
 * 3. Runs structured extraction once
 * Returns { extractedText, extractedSummary }
 */
async function processProductDocuments(documents) {
  if (!documents || documents.length === 0) {
    return { extractedText: '', extractedSummary: null };
  }

  const textParts = [];

  for (const doc of documents) {
    try {
      const text = await extractTextFromImageUrl(doc.url);
      textParts.push(`[${doc.type.toUpperCase()} DOCUMENT]\n${text}`);
    } catch (err) {
      console.warn(`[OCR] Failed to extract from ${doc.url}:`, err.message);
      textParts.push(`[${doc.type.toUpperCase()} DOCUMENT]\n[Could not extract text from this document]`);
    }
  }

  const extractedText = textParts.join('\n\n---\n\n');

  // Run structured extraction ONCE using the combined text
  const extractedSummary = extractedText.trim()
    ? await extractStructuredSummary(extractedText)
    : null;

  return { extractedText, extractedSummary };
}

module.exports = { processProductDocuments, extractTextFromImageUrl };
