const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { extractTextFromFile, splitIntoSections } = require("../utils/parseResume");
const { computeSectionScores } = require("../utils/sectionScore");
const { buildExplanation, generateVerdict } = require("../utils/explain");
const { checkAts } = require("../utils/atsCheck");
const { generateSuggestions } = require("../utils/suggestions");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    const ok = [".pdf", ".docx"].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Only PDF or DOCX files are allowed."), ok);
  },
});

// In-memory store for MVP1 (no DB/auth yet). Keyed by content hash so
// re-submitting the same resume+JD pair doesn't recompute anything -
// this is the same idempotency idea the HLD calls for, just backed by
// a Map instead of Postgres+Redis until MVP2.
const resultCache = new Map();

function hashPair(resumeText, jdText) {
  return crypto.createHash("sha256").update(resumeText + "::" + jdText).digest("hex");
}

router.post("/", upload.single("resume"), async (req, res) => {
  const cleanupAndRespond = (status, body) => {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(status).json(body);
  };

  try {
    if (!req.file) {
      return cleanupAndRespond(400, { error: "No resume file uploaded. Field name must be 'resume'." });
    }
    const jdText = (req.body.jdText || "").trim();
    if (!jdText || jdText.length < 20) {
      return cleanupAndRespond(400, { error: "Job description text is required (min 20 characters)." });
    }

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);
    if (!resumeText || resumeText.trim().length < 20) {
      return cleanupAndRespond(400, { error: "Couldn't extract readable text from the resume file." });
    }

    const cacheKey = hashPair(resumeText, jdText);
    if (resultCache.has(cacheKey)) {
      return cleanupAndRespond(200, { ...resultCache.get(cacheKey), cached: true });
    }

    const sections = splitIntoSections(resumeText);
    const explanation = buildExplanation(resumeText, jdText);
    const { overall: score, breakdown } = computeSectionScores({
      resumeSections: sections,
      resumeText,
      jdText,
    });
    const ats = checkAts(resumeText, sections);

    // Verdict + suggestions can both hit the LLM - run them in parallel so a
    // configured API key doesn't double the request latency.
    const [verdict, suggestions] = await Promise.all([
      generateVerdict({
        score,
        matchedSkills: explanation.matchedSkills,
        missingSkills: explanation.missingSkills,
        weakAreas: explanation.weakAreas,
      }),
      generateSuggestions({
        resumeSections: sections,
        missingSkills: explanation.missingSkills,
        jdText,
      }),
    ]);

    const result = {
      score,
      breakdown,
      matchedSkills: explanation.matchedSkills,
      missingSkills: explanation.missingSkills,
      weakAreas: explanation.weakAreas,
      verdict,
      suggestions,
      ats,
      resumeCharCount: resumeText.length,
      cached: false,
    };

    resultCache.set(cacheKey, result);
    return cleanupAndRespond(200, result);
  } catch (err) {
    return cleanupAndRespond(500, { error: err.message || "Something went wrong while matching." });
  }
});

module.exports = router;