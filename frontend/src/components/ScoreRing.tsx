import { motion } from "framer-motion";

interface ScoreRingProps {
  score: number;
}

function scoreColor(score: number) {
  if (score >= 70) return "#0F6E56"; // teal-600
  if (score >= 40) return "#BA7517"; // amber-600
  return "#A32D2D"; // red-600
}

function scoreLabel(score: number) {
  if (score >= 70) return "Strong match";
  if (score >= 40) return "Partial match";
  return "Weak match";
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="srm-score-ring">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#E5E3DA"
          strokeWidth="14"
        />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 90 90)"
        />
        <text
          x="90"
          y="86"
          textAnchor="middle"
          fontSize="36"
          fontWeight="600"
          fill="#2C2C2A"
        >
          {score}
        </text>
        <text x="90" y="110" textAnchor="middle" fontSize="13" fill="#5F5E5A">
          out of 100
        </text>
      </svg>
      <p className="srm-score-ring__label" style={{ color }}>
        {scoreLabel(score)}
      </p>
    </div>
  );
}
