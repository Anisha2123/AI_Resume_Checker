import type { AtsReport } from "../types";

interface AtsChecklistProps {
  ats: AtsReport;
}

export default function AtsChecklist({ ats }: AtsChecklistProps) {
  return (
    <div className="srm-ats">
      <div className="srm-ats__header">
        <h3 className="srm-skill-list__title">ATS formatting check</h3>
        <span className="srm-ats__score">{ats.atsScore}/100</span>
      </div>
      <p className="srm-ats__note">
        Based on the text ATS systems would actually extract from your file - not a layout preview.
      </p>
      <ul className="srm-ats__list">
        {ats.checks.map((check) => (
          <li key={check.id} className={`srm-ats__item ${check.pass ? "srm-ats__item--pass" : "srm-ats__item--fail"}`}>
            <span className="srm-ats__icon">{check.pass ? "✓" : "✕"}</span>
            <div>
              <p className="srm-ats__label">{check.label}</p>
              <p className="srm-ats__message">{check.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}