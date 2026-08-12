import { useState } from "react";
import UploadForm from "./components/UploadForm";
import ResultsPanel from "./components/ResultsPanel";
import type { MatchResult } from "./types";

// In dev, Vite proxies /api → localhost:5050. Override with VITE_API_BASE for production.
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function App() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(resume: File, jdText: string) {
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jdText", jdText);

    try {
      const res = await fetch(`${API_BASE}/api/match`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }
      setResult(data);
    } catch (err) {
      console.error("Match request failed:", err);
      setError(
        "Couldn't reach the server. Is the backend running on port 5050? (Check the terminal — nodemon restarts briefly after file saves.)"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="srm-page">
      <header className="srm-header">
        <p className="srm-header__eyebrow">Resume matcher</p>
        <h1 className="srm-header__title">
          See exactly why your resume does — or doesn't — match a job
        </h1>
        <p className="srm-header__subtitle">
          Upload a resume and paste a job description. Get a match score, matched and missing
          skills, and gaps worth addressing before you apply.
        </p>
      </header>

      <main className="srm-main">
        <section className="srm-panel">
          <UploadForm onSubmit={handleSubmit} loading={loading} />
        </section>

        <section className="srm-panel srm-panel--results">
          {error && <p className="srm-form-error srm-form-error--panel">{error}</p>}
          {!error && !result && !loading && (
            <p className="srm-placeholder">Your match breakdown will show up here.</p>
          )}
          {loading && <p className="srm-placeholder">Scoring your resume against the job description...</p>}
          {result && <ResultsPanel result={result} />}
        </section>
      </main>
    </div>
  );
}

export default App;
