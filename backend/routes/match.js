const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { extractTextFromFile } = require("../utils/parseResume");
const { computeMatchScore } = require("../utils/similarity");
const { buildExplanation } = require("../utils/explain");

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

    const score = computeMatchScore(resumeText, jdText);
    const explanation = buildExplanation(resumeText, jdText);

    const result = {
      score,
      matchedSkills: explanation.matchedSkills,
      missingSkills: explanation.missingSkills,
      weakAreas: explanation.weakAreas,
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
