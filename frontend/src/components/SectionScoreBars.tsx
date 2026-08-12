import { motion } from "framer-motion";
import type { ScoreBreakdown } from "../types";

interface SectionScoreBarsProps {
  breakdown: ScoreBreakdown;
}

const ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "skillsMatch", label: "Skills match" },
  { key: "experienceRelevance", label: "Experience relevance" },
  { key: "educationFit", label: "Education fit" },
];

function barColor(value: number) {
  if (value >= 70) return "#0F6E56";
  if (value >= 40) return "#BA7517";
  return "#A32D2D";
}

export default function SectionScoreBars({ breakdown }: SectionScoreBarsProps) {
  return (
    <div className="srm-breakdown">
      <h3 className="srm-skill-list__title">Score breakdown</h3>
      <div className="srm-breakdown__rows">
        {ROWS.map(({ key, label }) => {
          const value = breakdown[key];
          return (
            <div className="srm-breakdown__row" key={key}>
              <div className="srm-breakdown__row-top">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="srm-breakdown__track">
                <motion.div
                  className="srm-breakdown__fill"
                  style={{ background: barColor(value) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}