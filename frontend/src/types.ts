export interface ScoreBreakdown {
  skillsMatch: number;
  experienceRelevance: number;
  educationFit: number;
}

export interface AtsCheckItem {
  id: string;
  label: string;
  pass: boolean;
  message: string;
}

export interface AtsReport {
  atsScore: number;
  checks: AtsCheckItem[];
}

export interface Suggestion {
  section: string;
  original_bullet: string | null;
  suggested_bullet: string;
  reason: string;
  source: "llm" | "template" | "template_fallback";
}

export interface MatchResult {
  score: number;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  weakAreas: string[];
  verdict: string;
  suggestions: Suggestion[];
  ats: AtsReport;
  resumeCharCount: number;
  cached: boolean;
}

export interface MatchError {
  error: string;
}