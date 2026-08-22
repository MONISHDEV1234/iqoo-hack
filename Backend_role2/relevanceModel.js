// ---------------------------------------------------------------------------
// Loads the trained logistic regression weights (see
// scripts/train_relevance_model.js) and scores candidate experiences
// against a query using: sigmoid(w . features + b)
//
// This REPLACES the old hardcoded formula:
//   0.82 * semanticSim + 0.18 * min(1, lexOverlap * 3)
// with a model whose weights were actually learned from labeled examples,
// even though those examples are synthetic (see training script for why).
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const WEIGHTS_PATH = path.join(__dirname, 'relevance_weights.json');

let model = null;
try {
  model = JSON.parse(fs.readFileSync(WEIGHTS_PATH, 'utf-8'));
} catch (e) {
  console.warn('WARNING: relevance_weights.json not found. Run `node scripts/train_relevance_model.js` first. Falling back to a fixed-weight formula.');
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function scoreRelevance({ semanticSim, lexicalOverlap, techMatch, patternMatch }) {
  if (!model) {
    // fallback so the server never hard-crashes if training hasn't been run
    return 0.82 * semanticSim + 0.18 * Math.min(1, lexicalOverlap * 3);
  }
  const features = [semanticSim, lexicalOverlap, techMatch, patternMatch];
  const z = model.weights.reduce((sum, w, i) => sum + w * features[i], 0) + model.bias;
  return sigmoid(z);
}

function isModelLoaded() {
  return model !== null;
}

module.exports = { scoreRelevance, isModelLoaded };
