const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const matchRoute = require("./routes/match");

const app = express();
const PORT = process.env.PORT || 5050;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/match", matchRoute);

// Multer/general error fallback so bad uploads return JSON, not HTML stack traces
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Request failed." });
});

app.listen(PORT, () => {
  console.log(`Resume-JD matcher API running on http://localhost:${PORT}`);
});
