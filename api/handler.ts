import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Determine dist path - try multiple locations for compatibility
// In Vercel serverless: process.cwd() points to repo root
// In local dev: __dirname is api/ so ../dist works
// With includeFiles, dist/ is available at process.cwd()/dist
const distCandidates = [
  path.join(process.cwd(), "dist"),
  path.join(__dirname, "../dist"),
  path.join(__dirname, "dist"),
];

let distPath = distCandidates[0]; // default to process.cwd()/dist
for (const candidate of distCandidates) {
  try {
    if (fs.existsSync(path.join(candidate, "index.html"))) {
      distPath = candidate;
      break;
    }
  } catch {
    // ignore
  }
}

// Debug endpoint to help diagnose path issues in production
app.get("/api/debug-paths", (_req, res) => {
  const results: Record<string, any> = {
    cwd: process.cwd(),
    dirname: __dirname,
    distPath,
    candidates: distCandidates.map((c) => ({
      path: c,
      exists: false,
      hasIndex: false,
    })),
  };
  for (let i = 0; i < distCandidates.length; i++) {
    try {
      results.candidates[i].exists = fs.existsSync(distCandidates[i]);
      results.candidates[i].hasIndex = fs.existsSync(
        path.join(distCandidates[i], "index.html")
      );
    } catch {
      // ignore
    }
  }
  try {
    const cwdFiles = fs.readdirSync(process.cwd()).slice(0, 30);
    results.cwdFiles = cwdFiles;
  } catch (e: any) {
    results.cwdFiles = "error: " + e.message;
  }
  try {
    if (fs.existsSync(distPath)) {
      results.distFiles = fs.readdirSync(distPath).slice(0, 30);
    }
  } catch (e: any) {
    results.distFiles = "error: " + e.message;
  }
  res.json(results);
});

// Serve static files from dist/ directory (Expo web build output)
app.use(express.static(distPath));

// SPA fallback: serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api/")) {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(
        `<!DOCTYPE html><html><body>` +
        `<h1>Static files not found</h1>` +
        `<p>distPath: ${distPath}</p>` +
        `<p>cwd: ${process.cwd()}</p>` +
        `<p>dirname: ${__dirname}</p>` +
        `<p>Check <a href="/api/debug-paths">/api/debug-paths</a> for details</p>` +
        `</body></html>`
      );
    }
  } else {
    res.status(404).json({ error: "Not Found" });
  }
});

export default app;
