# AI Resume ↔ JD Matcher — MVP 1

Upload a resume (PDF/DOCX), paste a job description, and get a match score with a
matched-skills / missing-skills / weak-areas breakdown.

This is **MVP 1** from the design doc: synchronous scoring, no auth, no queue —
the fastest path to something deployable and demoable. The architecture is written
so MVP 2 (auth, async job queue, Redis cache, Postgres) slots in without touching
the core matching logic.

## How matching works (no paid API required)

- **Score**: TF-IDF vectors + cosine similarity between resume text and JD text
  (`backend/utils/similarity.js`). This is the local stand-in for an embeddings API call —
  same interface, swap it out later without touching the route or the frontend.
- **Explainability**: a ~100-term tech skills dictionary (`backend/utils/skills.js`) is matched
  against both documents to produce matched/missing skills, plus a few literal
  weak-area heuristics (leadership, scale, cross-functional, production experience).

Nothing here calls a paid LLM API, so it's free to run and deploy as-is.

## Project structure

```
backend/
  server.js              Express entrypoint
  routes/match.js         POST /api/match
  utils/parseResume.js    PDF/DOCX → text
  utils/similarity.js     TF-IDF cosine similarity scoring
  utils/skills.js         Skills dictionary + extraction
  utils/explain.js        Matched/missing/weak-area logic
frontend/
  src/App.tsx              Page shell
  src/components/          UploadForm, ScoreRing, SkillBadgeList, ResultsPanel
  src/types.ts              Shared TS types
```

## Run locally

**Backend**
```bash
cd backend
npm install
node server.js       # http://localhost:5050
```

**Frontend** (separate terminal)
```bash
cd frontend
npm install
cp .env.example .env   # points VITE_API_BASE at the backend
npm run dev             # http://localhost:5173
```

## API

`POST /api/match` — multipart form-data
- `resume`: file (PDF or DOCX, max 5MB)
- `jdText`: string (min 20 characters)

Response:
```json
{
  "score": 62,
  "matchedSkills": ["react", "node.js", "system design"],
  "missingSkills": ["kubernetes", "kafka"],
  "weakAreas": ["Leadership / ownership examples"],
  "resumeCharCount": 1450,
  "cached": false
}
```

## What's deliberately not in MVP 1

Per the design doc's phasing, these are MVP 2+ and not built here yet:
- Auth, multi-user accounts, match history
- Async job queue (BullMQ) + Redis cache
- Postgres persistence (MVP 1 caches in-memory, per server run)
- Razorpay subscription, resume regeneration, PDF/DOCX export

## Deploying for free (for your resume link)

- **Backend**: Render or Railway free tier (Node service)
- **Frontend**: Vercel or Netlify, set `VITE_API_BASE` to your deployed backend URL
