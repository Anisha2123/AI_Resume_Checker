const { extractSkills, normalize } = require("./skills");

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

module.exports = { buildExplanation };
