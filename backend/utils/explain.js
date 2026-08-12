const { extractSkills, normalize } = require("./skills");
const { isLLMConfigured, callClaude } = require("./llm");

// Weak-area heuristics: phrases that, if present in the JD but absent from
// the resume, suggest the resume under-represents something interviewers
// commonly screen for. Kept small and literal on purpose for MVP1 -
// this is the first thing to hand off to an LLM in MVP2 for nuance.
const WEAK_AREA_SIGNALS = [
  { jdPhrase: "lead", resumeCheck: ["led", "leadership", "mentor", "managed"], label: "Leadership / ownership examples" },
  { jdPhrase: "mentor", resumeCheck: ["mentor", "mentored", "coached"], label: "Mentoring experience" },
  { jdPhrase: "scale", resumeCheck: ["scale", "scalab", "high traffic", "million"], label: "Evidence of working at scale" },
  { jdPhrase: "cross-functional", resumeCheck: ["cross-functional", "stakeholder", "collaborat"], label: "Cross-functional collaboration" },
  { jdPhrase: "production", resumeCheck: ["production", "deployed", "live"], label: "Production/deployment experience" },
];

function buildExplanation(resumeText, jdText) {
  const resumeSkills = extractSkills(resumeText);
  const jdSkills = extractSkills(jdText);

  const resumeSet = new Set(resumeSkills);
  const jdSet = new Set(jdSkills);

  const matchedSkills = jdSkills.filter((s) => resumeSet.has(s));
  const missingSkills = jdSkills.filter((s) => !resumeSet.has(s));

  const normResume = normalize(resumeText);
  const normJd = normalize(jdText);

  const weakAreas = WEAK_AREA_SIGNALS
    .filter((signal) => normJd.includes(signal.jdPhrase))
    .filter((signal) => !signal.resumeCheck.some((kw) => normResume.includes(kw)))
    .map((signal) => signal.label);

  return { matchedSkills, missingSkills, weakAreas, jdSkillCount: jdSkills.length };
}

// Plain-English verdict on the match. Uses the LLM if configured for a more
// natural, specific read of the gap; otherwise builds the same kind of
// sentence from the numbers we already have, so the field is always present
// and never blank.
async function generateVerdict({ score, matchedSkills, missingSkills, weakAreas }) {
  if (!isLLMConfigured()) {
    return ruleBasedVerdict({ score, matchedSkills, missingSkills, weakAreas });
  }

  const prompt = `Write a 2-3 sentence, direct, plain-English verdict for a candidate about how well their resume matches a job description. Be honest, not falsely encouraging. No greeting, no markdown, no preamble.

Match score: ${score}/100
Matched skills: ${matchedSkills.join(", ") || "none"}
Missing skills: ${missingSkills.join(", ") || "none"}
Weak areas: ${weakAreas.join(", ") || "none"}`;

  try {
    const text = await callClaude(prompt, 300);
    return text.trim() || ruleBasedVerdict({ score, matchedSkills, missingSkills, weakAreas });
  } catch (err) {
    return ruleBasedVerdict({ score, matchedSkills, missingSkills, weakAreas });
  }
}

function ruleBasedVerdict({ score, matchedSkills, missingSkills, weakAreas }) {
  let tier;
  if (score >= 70) tier = "This is a strong match.";
  else if (score >= 40) tier = "This is a partial match.";
  else tier = "This is a weak match as written.";

  const parts = [tier];
  if (matchedSkills.length) parts.push(`You already cover ${matchedSkills.slice(0, 5).join(", ")}.`);
  if (missingSkills.length) parts.push(`The JD also wants ${missingSkills.slice(0, 5).join(", ")}, which isn't showing up in your resume.`);
  if (weakAreas.length) parts.push(`Worth strengthening: ${weakAreas.join(", ")}.`);
  return parts.join(" ");
}

module.exports = { buildExplanation, generateVerdict };