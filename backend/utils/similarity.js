const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Tokenize + stem, dropping short/stopword-ish tokens. This is the
// "embedding" stand-in for MVP1: no external API cost, fully local,
// deterministic. In MVP2+ this function is what gets swapped for a real
// embeddings API call - everything downstream (score math) stays the same.
function tokenize(text) {
  const tokens = tokenizer.tokenize((text || "").toLowerCase());
  return tokens
    .filter((t) => t.length > 2 && /[a-z]/.test(t))
    .map((t) => stemmer.stem(t));
}

// Build a term-frequency map for a token list.
function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

// Cosine similarity between two term-frequency vectors, scaled with
// inverse-document-frequency across just these two documents (a lightweight
// TF-IDF - enough to down-weight generic words like "team" or "work" that
// appear in both resume and JD without carrying real signal).
function cosineSimilarity(tfA, tfB) {
  const vocab = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
  let dot = 0, magA = 0, magB = 0;

  for (const term of vocab) {
    const inA = tfA[term] ? 1 : 0;
    const inB = tfB[term] ? 1 : 0;
    const df = inA + inB; // document frequency across our 2-doc corpus
    const idf = Math.log(2 / df) + 1; // 1.0 for terms in both docs, higher for terms in only one... inverted on purpose below

    const weightA = (tfA[term] || 0) * idf;
    const weightB = (tfB[term] || 0) * idf;

    dot += weightA * weightB;
    magA += weightA * weightA;
    magB += weightB * weightB;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Public entry point: returns a 0-100 similarity score between resume text
// and JD text.
function computeMatchScore(resumeText, jdText) {
  const tfA = termFrequency(tokenize(resumeText));
  const tfB = termFrequency(tokenize(jdText));
  const sim = cosineSimilarity(tfA, tfB); // 0..1
  return Math.round(Math.min(sim, 1) * 100);
}

module.exports = { tokenize, computeMatchScore };
