const { processProductDocuments } = require('./utils/ocrExtractor');
require('dotenv').config();

async function run() {
  const documents = [
    { url: 'https://res.cloudinary.com/dfszd5e3x/image/upload/v1713809635/sample.jpg', type: 'bill' }
  ];
  try {
    const result = await processProductDocuments(documents);
    console.log("OCR Result:", result);
  } catch (err) {
    console.error("Caught error:", err);
  }
}
run();
