// Heuristic ATS-safety checks run on extracted plain text. This catches
// content-level issues (missing contact info, no metrics, weak phrasing,
// wrong length) - it can't see true layout problems like multi-column PDFs
// or embedded tables/images, since those don't survive text extraction.
// Flagged as heuristic in the UI copy for that reason, not a guarantee.
function checkAts(resumeText, sections) {
    const checks = [];
  
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
    checks.push({
      id: "contact_email",
      label: "Email address present",
      pass: hasEmail,
      message: hasEmail
        ? "Found an email address."
        : "No email address detected - ATS systems parse this into a contact field.",
    });
  
    const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(resumeText);
    checks.push({
      id: "contact_phone",
      label: "Phone number present",
      pass: hasPhone,
      message: hasPhone ? "Found a phone number." : "No phone number detected.",
    });
  
    const wordCount = resumeText.trim().split(/\s+/).filter(Boolean).length;
    const lengthOk = wordCount >= 250 && wordCount <= 900;
    checks.push({
      id: "length",
      label: "Resume length",
      pass: lengthOk,
      message:
        `${wordCount} words. ` +
        (lengthOk
          ? "Good length for one to two pages."
          : wordCount < 250
          ? "Reads short - ATS and recruiters may see it as underdeveloped."
          : "Reads long - consider trimming to one or two pages."),
    });
  
    const hasSkillsSection = (sections.skills || "").trim().length > 10;
    checks.push({
      id: "skills_section",
      label: "Dedicated skills section",
      pass: hasSkillsSection,
      message: hasSkillsSection
        ? "Skills section detected."
        : "No clear skills section found - ATS keyword scans rely heavily on this.",
    });
  
    const hasExperienceSection = (sections.experience || "").trim().length > 10;
    checks.push({
      id: "experience_section",
      label: "Experience section",
      pass: hasExperienceSection,
      message: hasExperienceSection ? "Experience section detected." : "No clear experience section found.",
    });
  
    const quantifiedMatches = resumeText.match(/\d+(\.\d+)?\s*(%|percent|x\b|k\b|million|users|requests|ms|sec)/gi) || [];
    const quantifiedOk = quantifiedMatches.length >= 2;
    checks.push({
      id: "quantification",
      label: "Quantified achievements",
      pass: quantifiedOk,
      message: quantifiedOk
        ? `Found ${quantifiedMatches.length} quantified metric(s) (%, scale, time, etc.).`
        : "Few or no quantified metrics found - numbers make bullets more credible and scannable.",
    });
  
    const weakPhrases = ["responsible for", "worked on", "helped with", "involved in"];
    const foundWeak = weakPhrases.filter((phrase) => resumeText.toLowerCase().includes(phrase));
    checks.push({
      id: "strong_verbs",
      label: "Strong action verbs",
      pass: foundWeak.length === 0,
      message:
        foundWeak.length === 0
          ? "No weak filler phrases detected."
          : `Found weak phrases: "${foundWeak.join('", "')}" - replace with direct verbs (built, led, shipped, reduced).`,
    });
  
    const passCount = checks.filter((c) => c.pass).length;
    const atsScore = Math.round((passCount / checks.length) * 100);
  
    return { atsScore, checks };
  }
  
  module.exports = { checkAts };