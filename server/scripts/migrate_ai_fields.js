require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { processProductDocuments } = require('../utils/ocrExtractor');

async function migrateAIFields() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hometrack';
    await mongoose.connect(mongoUri);
    console.log('[Migration] Connected to database.');

    // Find products that have documents but no OCR completed
    const products = await Product.find({
      'documents.0': { $exists: true },
      ocrStatus: { $in: ['none', null, undefined] }
    });

    console.log(`[Migration] Found ${products.length} products needing OCR processing.`);

    for (const product of products) {
      console.log(`\n[Migration] Processing product: ${product.productName} (${product._id})`);
      
      try {
        product.ocrStatus = 'pending';
        await product.save();

        // Process OCR
        console.log(`[Migration] Starting extraction for ${product.documents.length} document(s)...`);
        const { extractedText, extractedSummary } = await processProductDocuments(product.documents);

        product.extractedText = extractedText;
        product.extractedSummary = extractedSummary;
        product.ocrStatus = 'done';
        await product.save();
        
        console.log(`[Migration] Successfully processed ${product.productName}.`);
      } catch (err) {
        console.error(`[Migration] Failed processing ${product.productName}:`, err.message);
        product.ocrStatus = 'failed';
        await product.save();
      }
      
      // Delay to avoid hitting API rate limits
      await new Promise(res => setTimeout(res, 2000));
    }

    console.log('\n[Migration] Migration complete.');
  } catch (err) {
    console.error('[Migration] Error:', err);
  } finally {
    mongoose.connection.close();
  }
}

migrateAIFields();
