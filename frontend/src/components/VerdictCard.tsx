interface VerdictCardProps {
    verdict: string;
  }
  
  export default function VerdictCard({ verdict }: VerdictCardProps) {
    return (
      <div className="srm-verdict">
        <p className="srm-verdict__text">{verdict}</p>
      </div>
    );
  }