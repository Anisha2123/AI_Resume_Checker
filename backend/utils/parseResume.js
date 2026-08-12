const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

// Extracts raw text from an uploaded resume file (PDF or DOCX).
// Throws a descriptive error for unsupported types so the API layer
// can return a clean 400 instead of a stack trace.
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error(`Unsupported file type "${ext}". Please upload a PDF or DOCX.`);
}

// Very lightweight section splitter. Real resumes vary a lot in formatting,
// so this looks for common section headers rather than trying to be a full
// resume parser. Good enough for MVP1 - can be swapped for a smarter
// classifier later without changing the API contract.
// Each pattern captures the header text so we can also handle resumes where
// the header and its content sit on the same line/paragraph (e.g.
// "Skills: JavaScript, React, Node.js...") - common when a DOCX heading and
// its body get flattened into one paragraph by text extraction.
const SECTION_HEADERS = {
  skills: /^(technical\s+)?skills?\b\s*[:\-]?\s*/i,
  experience: /^((work\s+)?experience|employment)\b\s*[:\-]?\s*/i,
  education: /^education\b\s*[:\-]?\s*/i,
  projects: /^projects?\b\s*[:\-]?\s*/i,
  summary: /^(summary|objective|profile)\b\s*[:\-]?\s*/i,
};

function splitIntoSections(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections = { summary: [], skills: [], experience: [], education: [], projects: [], other: [] };
  let current = "other";

  for (const line of lines) {
    let matchedKey = null;
    let remainder = null;

    // Only treat a line as a header if the header keyword starts the line
    // and the line isn't a long paragraph that merely happens to begin with
    // one of these words (e.g. "Experienced engineer..." shouldn't match).
    for (const [key, pattern] of Object.entries(SECTION_HEADERS)) {
      const match = line.match(pattern);
      if (match && match[0].trim().replace(/[:\-]$/, "").length <= 20) {
        matchedKey = key;
        remainder = line.slice(match[0].length).trim();
        break;
      }
    }

    if (matchedKey) {
      current = matchedKey;
      if (remainder) sections[current].push(remainder); // header + inline content on one line
      continue;
    }
    sections[current].push(line);
  }

  const joined = {};
  for (const key of Object.keys(sections)) joined[key] = sections[key].join(" ");
  return joined;
}

module.exports = { extractTextFromFile, splitIntoSections };