import { motion } from "framer-motion";
import ScoreRing from "./ScoreRing";
import SkillBadgeList from "./SkillBadgeList";
import type { MatchResult } from "../types";

interface ResultsPanelProps {
  result: MatchResult;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <motion.div
      className="srm-results"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="srm-results__top">
        <ScoreRing score={result.score} />
        {result.cached && <p className="srm-results__cached-note">Loaded from a previous check on this exact pair</p>}
      </div>

      <div className="srm-results__grid">
        <SkillBadgeList
          title="Matched skills"
          skills={result.matchedSkills}
          variant="matched"
          emptyText="No direct keyword overlap found."
        />
        <SkillBadgeList
          title="Missing from your resume"
          skills={result.missingSkills}
          variant="missing"
          emptyText="Nothing obvious missing — nice."
        />
      </div>

      {result.weakAreas.length > 0 && (
        <div className="srm-weak-areas">
          <h3 className="srm-skill-list__title">Worth strengthening</h3>
          <ul className="srm-weak-areas__list">
            {result.weakAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
