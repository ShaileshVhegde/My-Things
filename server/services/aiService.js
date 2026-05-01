const axios = require('axios');

// ── OpenRouter client ────────────────────────────────────────────────────────
async function askAI(systemPrompt, userMessage) {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openrouter/auto',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
          'X-Title': 'Home Track AI',
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.error('[AI] OpenRouter failed:', err.response?.data || err.message);
    throw new Error('AI service not available. Please try again.');
  }
}

// ── Public: extract structured summary from raw OCR text ───────────────────────
async function extractStructuredSummary(rawText) {
  const systemPrompt = `You are a product document analyst. Extract key information from the following OCR text and return it as valid JSON only. 
  
  Return this exact JSON structure:
  {
    "productName": "...",
    "brand": "...",
    "model": "...",
    "purchaseDate": "...",
    "purchasePrice": "...",
    "warrantyExpiry": "...",
    "storeName": "...",
    "storePhone": "...",
    "serialNumber": "...",
    "keyFeatures": ["...", "..."],
    "importantNotes": "..."
  }
  
  Use "N/A" for any field not found. Return ONLY the JSON, no extra text.`;

  const prompt = `Extract product name, purchase date, warranty expiry, and store details from this text:\n\n${rawText.slice(0, 3000)}`;
  
  try {
    const raw = await askAI(systemPrompt, prompt);
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[AI] Structured summary extraction failed:', err.message);
    return { rawText: rawText.slice(0, 500), note: 'Could not parse structured summary.' };
  }
}

module.exports = { askAI, extractStructuredSummary };
