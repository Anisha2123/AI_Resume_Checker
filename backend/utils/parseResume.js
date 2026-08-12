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
const SECTION_HEADERS = {
  skills: /^(technical\s+)?skills?\b/i,
  experience: /^(work\s+)?experience\b|^employment\b/i,
  education: /^education\b/i,
  projects: /^projects?\b/i,
  summary: /^summary\b|^objective\b|^profile\b/i,
};

function splitIntoSections(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections = { summary: [], skills: [], experience: [], education: [], projects: [], other: [] };
  let current = "other";

  for (const line of lines) {
    let matchedHeader = null;
    for (const [key, pattern] of Object.entries(SECTION_HEADERS)) {
      if (pattern.test(line) && line.length < 40) {
        matchedHeader = key;
        break;
      }
    }
    if (matchedHeader) {
      current = matchedHeader;
      continue; // don't include the header line itself
    }
    sections[current].push(line);
  }

  const joined = {};
  for (const key of Object.keys(sections)) joined[key] = sections[key].join(" ");
  return joined;
}

module.exports = { extractTextFromFile, splitIntoSections };
