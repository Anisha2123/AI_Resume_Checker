import type { Suggestion } from "../types";

interface SuggestionsListProps {
  suggestions: Suggestion[];
}

export default function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="srm-suggestions">
      <h3 className="srm-skill-list__title">Suggested edits</h3>
      <div className="srm-suggestions__list">
        {suggestions.map((s, i) => (
          <div className="srm-suggestion" key={i}>
            {s.original_bullet && (
              <p className="srm-suggestion__original">
                <span className="srm-suggestion__tag srm-suggestion__tag--before">Before</span>
                {s.original_bullet}
              </p>
            )}
            <p className="srm-suggestion__new">
              <span className="srm-suggestion__tag srm-suggestion__tag--after">
                {s.original_bullet ? "After" : "Suggestion"}
              </span>
              {s.suggested_bullet}
            </p>
            <p className="srm-suggestion__reason">{s.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}