const { computeMatchScore } = require("./similarity");
const { extractSkills } = require("./skills");

// Splits the single match score into a breakdown so the output reads like a
// real resume-checker report instead of one opaque number. Weighted: skills
// matter most for keyword/ATS screening, experience relevance next, education
// least (and only penalized if the JD actually asks for a specific degree).
function computeSectionScores({ resumeSections, resumeText, jdText }) {
  const jdSkills = extractSkills(jdText);
  const resumeSkills = extractSkills(resumeText);
  const matchedCount = jdSkills.filter((s) => resumeSkills.includes(s)).length;
  const skillsScore = jdSkills.length === 0 ? 100 : Math.round((matchedCount / jdSkills.length) * 100);

  const experienceText = (resumeSections.experience || resumeSections.projects || "").trim();
  const experienceScore = experienceText.length > 0 ? computeMatchScore(experienceText, jdText) : 0;

  const jdWantsDegree = /\b(bachelor|master|b\.?tech|m\.?tech|degree|bs|ms|phd)\b/i.test(jdText);
  const hasEducation = (resumeSections.education || "").trim().length > 0;
  const educationScore = !jdWantsDegree ? 100 : hasEducation ? 90 : 30;

  const overall = Math.round(skillsScore * 0.5 + experienceScore * 0.35 + educationScore * 0.15);

  return {
    overall,
    breakdown: {
      skillsMatch: skillsScore,
      experienceRelevance: experienceScore,
      educationFit: educationScore,
    },
  };
}

module.exports = { computeSectionScores };