interface SkillBadgeListProps {
  title: string;
  skills: string[];
  variant: "matched" | "missing";
  emptyText: string;
}

export default function SkillBadgeList({ title, skills, variant, emptyText }: SkillBadgeListProps) {
  const variantClass =
    variant === "matched" ? "srm-badge srm-badge--matched" : "srm-badge srm-badge--missing";

  return (
    <div className="srm-skill-list">
      <h3 className="srm-skill-list__title">{title}</h3>
      {skills.length === 0 ? (
        <p className="srm-skill-list__empty">{emptyText}</p>
      ) : (
        <div className="srm-skill-list__badges">
          {skills.map((skill) => (
            <span key={skill} className={variantClass}>
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
