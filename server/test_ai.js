const fetch = require('node-fetch');

async function run() {
  // Mock call directly to aiService
  const { askAI } = require('./services/aiService');
  require('dotenv').config();
  try {
    const response = await askAI("Hello, you are an assistant.", "Who are you?");
    console.log("Response:", response);
  } catch (err) {
    console.error("Caught error:", err);
  }
}
run();
