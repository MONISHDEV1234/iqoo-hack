// ---------------------------------------------------------------------------
// Trains a small logistic regression "relevance model" that decides how
// relevant a candidate past experience is to a new query, given a feature
// vector [semanticSim, lexicalOverlap, techMatch, patternMatch].
//
// HONEST NOTE ON TRAINING DATA:
// The architecture doc suggests training on a real bug/duplicate-issue
// dataset (e.g. BugHub). That requires downloading and labeling a real
// corpus, which isn't achievable in hackathon time. Instead, this script
// generates SYNTHETIC labeled pairs: it takes feature combinations that
// *should* indicate relevance (high semantic sim + tech/pattern overlap)
// as positives, and combinations that shouldn't (low semantic sim, no
// overlap) as negatives, with noise mixed in so it's not a trivial
// threshold. This is a real, genuinely trained model — just trained on
// synthetic data rather than a labeled real-world corpus. Say this
// plainly if asked; it's a reasonable hackathon tradeoff, not a fake model.
//
// Run with: node scripts/train_relevance_model.js
// Produces: lib/relevance_weights.json
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function generateSyntheticData(n = 2000) {
  const X = [];
  const y = [];
  for (let i = 0; i < n; i++) {
    const isRelevantPair = Math.random() < 0.5;

    let semanticSim, lexOverlap, techMatch, patternMatch;
    if (isRelevantPair) {
      // relevant pairs: generally high semantic similarity, often shared
      // technology/pattern tags, but with realistic noise
      semanticSim = clamp(rand(0.55, 0.97) + gaussianNoise(0.05));
      lexOverlap = clamp(rand(0.1, 0.8) + gaussianNoise(0.1));
      techMatch = Math.random() < 0.7 ? 1 : 0;
      patternMatch = Math.random() < 0.6 ? 1 : 0;
    } else {
      // irrelevant pairs: generally low semantic similarity
      semanticSim = clamp(rand(0.0, 0.5) + gaussianNoise(0.08));
      lexOverlap = clamp(rand(0.0, 0.3) + gaussianNoise(0.05));
      techMatch = Math.random() < 0.15 ? 1 : 0;
      patternMatch = Math.random() < 0.1 ? 1 : 0;
    }

    X.push([semanticSim, lexOverlap, techMatch, patternMatch]);
    y.push(isRelevantPair ? 1 : 0);
  }
  return { X, y };
}

function rand(min, max) { return min + Math.random() * (max - min); }
function clamp(v) { return Math.max(0, Math.min(1, v)); }
function gaussianNoise(std) {
  const u1 = Math.random(), u2 = Math.random();
  return std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function trainLogisticRegression(X, y, { epochs = 500, lr = 0.1 } = {}) {
  const nFeatures = X[0].length;
  let weights = new Array(nFeatures).fill(0);
  let bias = 0;
  const n = X.length;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(nFeatures).fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i++) {
      const z = dot(weights, X[i]) + bias;
      const pred = sigmoid(z);
      const error = pred - y[i];
      for (let j = 0; j < nFeatures; j++) gradW[j] += error * X[i][j];
      gradB += error;
    }
    for (let j = 0; j < nFeatures; j++) weights[j] -= (lr * gradW[j]) / n;
    bias -= (lr * gradB) / n;
  }
  return { weights, bias };
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function evaluate(weights, bias, X, y) {
  let correct = 0;
  for (let i = 0; i < X.length; i++) {
    const pred = sigmoid(dot(weights, X[i]) + bias) >= 0.5 ? 1 : 0;
    if (pred === y[i]) correct++;
  }
  return correct / X.length;
}

// ---- run ----
const { X, y } = generateSyntheticData(2000);
const splitIdx = Math.floor(X.length * 0.8);
const trainX = X.slice(0, splitIdx), trainY = y.slice(0, splitIdx);
const testX = X.slice(splitIdx), testY = y.slice(splitIdx);

const { weights, bias } = trainLogisticRegression(trainX, trainY);
const trainAcc = evaluate(weights, bias, trainX, trainY);
const testAcc = evaluate(weights, bias, testX, testY);

console.log('Trained logistic regression relevance model.');
console.log('Features: [semanticSim, lexicalOverlap, techMatch, patternMatch]');
console.log('Weights:', weights.map(w => w.toFixed(4)));
console.log('Bias:', bias.toFixed(4));
console.log('Train accuracy:', (trainAcc * 100).toFixed(1) + '%');
console.log('Test accuracy:', (testAcc * 100).toFixed(1) + '%');

const outPath = path.join(__dirname, '..', 'lib', 'relevance_weights.json');
fs.writeFileSync(outPath, JSON.stringify({
  weights,
  bias,
  features: ['semanticSim', 'lexicalOverlap', 'techMatch', 'patternMatch'],
  trainedOn: 'synthetic',
  trainAccuracy: trainAcc,
  testAccuracy: testAcc,
  trainedAt: new Date().toISOString()
}, null, 2));
console.log('Saved weights to', outPath);
