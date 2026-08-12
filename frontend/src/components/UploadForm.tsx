import { useRef, useState } from "react";

interface UploadFormProps {
  onSubmit: (resume: File, jdText: string) => void;
  loading: boolean;
}

export default function UploadForm({ onSubmit, loading }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSetFile(candidate: File) {
    const ok = /\.(pdf|docx)$/i.test(candidate.name);
    if (!ok) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    setError("");
    setFile(candidate);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Add a resume file first.");
      return;
    }
    if (jdText.trim().length < 20) {
      setError("Paste a job description (at least 20 characters).");
      return;
    }
    setError("");
    onSubmit(file, jdText.trim());
  }

  return (
    <form className="srm-upload-form" onSubmit={handleSubmit}>
      <div
        className={`srm-dropzone ${dragActive ? "srm-dropzone--active" : ""} ${
          file ? "srm-dropzone--filled" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="srm-dropzone__input"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) validateAndSetFile(selected);
          }}
        />
        {file ? (
          <div className="srm-dropzone__filename">
            <span>{file.name}</span>
            <button
              type="button"
              className="srm-dropzone__remove"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <p className="srm-dropzone__title">Drop your resume here</p>
            <p className="srm-dropzone__hint">PDF or DOCX, up to 5MB</p>
          </>
        )}
      </div>

      <label className="srm-field-label" htmlFor="jdText">
        Job description
      </label>
      <textarea
        id="jdText"
        className="srm-textarea"
        placeholder="Paste the full job description here..."
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={8}
      />

      {error && <p className="srm-form-error">{error}</p>}

      <button type="submit" className="srm-submit-btn" disabled={loading}>
        {loading ? "Matching..." : "Check my match"}
      </button>
    </form>
  );
}
