const Product = require('../models/Product');
const { processProductDocuments } = require('../utils/ocrExtractor');
const { askAI } = require('../services/aiService');

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/ai/extract
// Triggered after a product is saved. Runs OCR + structured extraction ONCE.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.extractProductData = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required.' });

    const product = await Product.findOne({ _id: productId, userId: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Skip if no documents uploaded
    if (!product.documents || product.documents.length === 0) {
      await Product.findByIdAndUpdate(productId, { ocrStatus: 'none' });
      return res.json({ message: 'No documents to extract from.', ocrStatus: 'none' });
    }

    // Mark as pending
    await Product.findByIdAndUpdate(productId, { ocrStatus: 'pending' });

    // Run OCR + structured extraction (async â€” fire & store)
    processProductDocuments(product.documents)
      .then(async ({ extractedText, extractedSummary }) => {
        await Product.findByIdAndUpdate(productId, {
          extractedText,
          extractedSummary,
          ocrStatus: 'done',
        });
        console.log(`[OCR] Done for product: ${product.productName}`);
      })
      .catch(async (err) => {
        console.error('[OCR] Failed:', err.message);
        try {
          await Product.findByIdAndUpdate(productId, { ocrStatus: 'failed' });
        } catch (dbErr) {
          console.error('[OCR] Failed to update DB status:', dbErr.message);
        }
      });

    res.json({ message: 'Extraction started in background.', ocrStatus: 'pending' });
  } catch (err) {
    console.error('[extractProductData]', err);
    res.status(500).json({ message: 'Server error during extraction.' });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/ai/ask
// Answers a user question about a product using stored context.
// Token-optimised: uses summary first, falls back to raw text if needed.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.askProductQuestion = async (req, res) => {
  try {
    const { productId, question } = req.body;
    if (!productId || !question) {
      return res.status(400).json({ message: 'productId and question are required.' });
    }

    const product = await Product.findOne({ _id: productId, userId: req.user.id });
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Build context â€” prefer summary to save tokens
    let contextSection = '';
    if (product.extractedSummary) {
      contextSection = `EXTRACTED DOCUMENT SUMMARY:\n${JSON.stringify(product.extractedSummary, null, 2)}`;
      // Append partial raw text if summary is sparse
      if (product.extractedText && product.extractedText.length > 50) {
        contextSection += `\n\nPARTIAL RAW TEXT (first 1500 chars):\n${product.extractedText.slice(0, 1500)}`;
      }
    } else if (product.extractedText) {
      contextSection = `RAW DOCUMENT TEXT:\n${product.extractedText.slice(0, 2000)}`;
    }

    // Core product info always included
    const productInfo = `
PRODUCT DETAILS:
- Name: ${product.productName}
- Category: ${product.category}
- Purchase Date: ${product.purchaseDate?.toDateString?.() || 'N/A'}
- Warranty Expires: ${product.warrantyExpiryDate?.toDateString?.() || 'N/A'}
- Store: ${product.storeDetails?.storeName || 'N/A'}
- Notes: ${product.notes || 'None'}
`.trim();

    const documentTypes = product.documents?.map(d => d.type).join(', ') || 'None';

    const systemPrompt = `You are a helpful AI warranty assistant for a product management app called "Home Track".
You help users understand their product warranties, receipts, and documents.

${productInfo}

This product has the following document types attached: ${documentTypes}.

${contextSection || 'No documents have been analyzed yet for this product.'}

Answer only based on the provided product data. Be clear and accurate.`;

    const answer = await askAI(systemPrompt, question);

    // Persist chat history (keep last 20 messages per product)
    const historyEntry = { question, answer, timestamp: new Date() };
    await Product.findByIdAndUpdate(productId, {
      $push: {
        chatHistory: {
          $each: [historyEntry],
          $slice: -20,
        },
      },
    });

    res.json({ answer, productName: product.productName });
  } catch (err) {
    console.error('[askProductQuestion]', err);
    const userFriendlyMessage = err.message.includes('unavailable')
      ? err.message
      : 'AI service not responding. Please try again later.';
    res.status(500).json({ message: userFriendlyMessage });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/ai/status/:productId
// Returns OCR status + summary + chat history for a product
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getProductAIStatus = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      userId: req.user.id,
    }).select('productName extractedSummary ocrStatus chatHistory documents');

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    res.json({
      productName: product.productName,
      ocrStatus: product.ocrStatus,
      extractedSummary: product.extractedSummary,
      chatHistory: product.chatHistory || [],
      hasDocuments: product.documents?.length > 0,
    });
  } catch (err) {
    console.error('[getProductAIStatus]', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

