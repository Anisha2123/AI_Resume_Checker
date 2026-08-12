export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  weakAreas: string[];
  resumeCharCount: number;
  cached: boolean;
}

export interface MatchError {
  error: string;
}
