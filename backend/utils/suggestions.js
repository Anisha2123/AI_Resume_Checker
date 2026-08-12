const { isLLMConfigured, callClaude, extractJson } = require("./llm");

// Bullet-level suggestions, not a full silent rewrite - the LLM is explicitly
// told not to invent tools, metrics, or responsibilities the resume doesn't
// already imply. The user reviews and accepts/rejects each one individually
// on the frontend. Falls back to a plain template suggestion per missing
// skill if no API key is configured, so the feature still returns something
// useful for free.
async function generateSuggestions({ resumeSections, missingSkills, jdText }) {
  const experienceText = (resumeSections.experience || resumeSections.projects || "").trim();

  if (!isLLMConfigured() || !experienceText || missingSkills.length === 0) {
    return templateSuggestions(missingSkills);
  }

  const prompt = `You are helping a candidate improve their resume for a specific job description, without inventing any experience they don't have.

Resume experience section:
"""
${experienceText.slice(0, 3000)}
"""

Job description:
"""
${jdText.slice(0, 2000)}
"""

Skills the JD wants that are missing from the resume: ${missingSkills.slice(0, 8).join(", ")}

For up to 5 existing resume bullets, suggest a rewritten version that better surfaces relevant skills or keywords ALREADY implied by the bullet. Do not invent tools, metrics, or responsibilities not implied by the original. If a bullet cannot honestly be improved, skip it rather than fabricate.

Respond with ONLY a JSON array, no prose, no markdown fences:
[{ "section": "experience", "original_bullet": "...", "suggested_bullet": "...", "reason": "..." }]`;

  try {
    const raw = await callClaude(prompt, 1200);
    const parsed = extractJson(raw);
    if (!Array.isArray(parsed)) throw new Error("LLM did not return a JSON array.");
    return parsed.map((s) => ({ ...s, source: "llm" }));
  } catch (err) {
    // LLM failed or returned malformed JSON - degrade to the free template
    // path instead of failing the whole /api/match request.
    return templateSuggestions(missingSkills, err.message);
  }
}

function templateSuggestions(missingSkills, errorNote) {
  return missingSkills.slice(0, 5).map((skill) => ({
    section: "skills",
    original_bullet: null,
    suggested_bullet: `If you've genuinely worked with ${skill}, add a line mentioning it in your skills or experience section.`,
    reason: errorNote
      ? `"${skill}" appears in the job description but not in your resume. (LLM suggestion unavailable: ${errorNote})`
      : `"${skill}" appears in the job description but not in your resume.`,
    source: errorNote ? "template_fallback" : "template",
  }));
}

module.exports = { generateSuggestions };