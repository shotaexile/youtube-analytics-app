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

// Debug endpoint to check paths in production
app.get("/api/debug-paths", (_req, res) => {
  const candidates = [
    path.join(__dirname, "../dist"),
    path.join(__dirname, "../../dist"),
    path.join(process.cwd(), "dist"),
    "/var/task/dist",
  ];
  const results = candidates.map(p => ({
    path: p,
    exists: fs.existsSync(p),
    hasIndex: fs.existsSync(path.join(p, "index.html")),
  }));
  res.json({ __dirname, cwd: process.cwd(), candidates: results });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Resolve dist directory - try multiple paths
function findDistDir(): string {
  const candidates = [
    path.join(__dirname, "../dist"),
    path.join(__dirname, "../../dist"),
    path.join(process.cwd(), "dist"),
    "/var/task/dist",
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "index.html"))) {
      console.log("[static] Using dist dir:", p);
      return p;
    }
  }
  console.warn("[static] Could not find dist dir, tried:", candidates);
  return candidates[0];
}

const distDir = findDistDir();

// Serve static files from dist directory
app.use(express.static(distDir));

// SPA fallback: serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`index.html not found. distDir=${distDir}`);
  }
});

export default app;
