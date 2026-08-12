// A dictionary of known tech skills/keywords used for matched/missing analysis.
// This is separate from the TF-IDF similarity score - it's what powers the
// "explainability" layer (which specific skills matched or are missing).

const SKILLS = [
  // languages
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "golang", "rust",
  "ruby", "php", "kotlin", "swift", "sql", "html", "css", "bash", "scala",
  // frontend
  "react", "react.js", "next.js", "vue", "angular", "redux", "tailwind", "tailwindcss",
  "bootstrap", "framer motion", "webpack", "vite", "jquery",
  // backend
  "node.js", "nodejs", "express", "express.js", "django", "flask", "spring",
  "spring boot", "fastapi", "graphql", "rest api", "grpc", "microservices",
  // databases
  "mongodb", "postgresql", "postgres", "mysql", "redis", "elasticsearch",
  "dynamodb", "cassandra", "sqlite", "pgvector", "vector database",
  // cloud & devops
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins",
  "github actions", "nginx", "linux", "serverless", "lambda",
  // data / ml
  "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow",
  "pytorch", "scikit-learn", "data analysis", "etl", "llm", "embeddings",
  "rag", "prompt engineering", "openai", "hugging face",
  // architecture / system design
  "system design", "distributed systems", "load balancing", "caching",
  "message queue", "kafka", "rabbitmq", "consistent hashing", "rate limiting",
  "async processing", "event driven", "webhooks", "api gateway", "sharding",
  "scalability", "high availability", "fault tolerance",
  // practices
  "agile", "scrum", "unit testing", "jest", "cypress", "tdd", "git", "github",
  "code review", "debugging", "performance optimization",
  // soft / role signals
  "leadership", "mentoring", "cross-functional", "stakeholder management",
  "communication", "ownership", "collaboration", "problem solving",
];

// normalize for matching: lowercase, collapse whitespace
function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// Extract which known skills appear in a block of text.
// Uses word-boundary-safe matching so "go" doesn't match inside "algorithm".
function extractSkills(text) {
  const norm = normalize(text);
  const found = new Set();
  for (const skill of SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
    if (pattern.test(norm)) found.add(skill);
  }
  return Array.from(found);
}

module.exports = { SKILLS, extractSkills, normalize };
