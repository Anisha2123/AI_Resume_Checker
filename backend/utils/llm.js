// Optional LLM integration. Nothing else in the app requires this - every
// caller falls back to rule-based logic if ANTHROPIC_API_KEY isn't set, so
// the project stays free to run by default. Set the key to unlock the
// LLM-written verdict and bullet-level rewrite suggestions.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function isLLMConfigured() {
  return Boolean(ANTHROPIC_API_KEY);
}

async function callClaude(prompt, maxTokens = 1024) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set - LLM features are disabled.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

// LLMs sometimes wrap JSON in markdown fences despite instructions - strip
// those before parsing rather than failing the whole request.
function extractJson(rawText) {
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

module.exports = { isLLMConfigured, callClaude, extractJson };