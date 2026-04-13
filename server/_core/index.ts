import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { upsertAiDailyReport } from "../db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Static file serving from dist/ ──────────────────────────────────────
  // Serve Expo Web build output. index: false so SPA fallback handles /
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath, { index: false }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // ─── Manus Push Endpoint ──────────────────────────────────────────────────
  // Called by Manus scheduled task every morning at 07:00 JST
  // Accepts AI info data and saves to DB
  app.post("/api/ai-info/push", async (req, res) => {
    try {
      // Verify API key for security
      const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
      const expectedKey = process.env.MANUS_PUSH_API_KEY;
      if (expectedKey && apiKey !== expectedKey) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { latestNews, toolRankings, videoAiTools, reportDate } = req.body;

      if (!latestNews && !toolRankings && !videoAiTools) {
        res.status(400).json({ error: "No data provided" });
        return;
      }

      const today = reportDate ? new Date(reportDate) : new Date();
      await upsertAiDailyReport({
        reportDate: today,
        latestNews: typeof latestNews === "string" ? latestNews : JSON.stringify(latestNews ?? []),
        toolRankings: typeof toolRankings === "string" ? toolRankings : JSON.stringify(toolRankings ?? []),
        videoAiTools: typeof videoAiTools === "string" ? videoAiTools : JSON.stringify(videoAiTools ?? []),
        generatedAt: new Date(),
      });

      console.log(`[manus-push] AI info saved for ${today.toISOString().split("T")[0]}`);
      res.json({ success: true, savedAt: new Date().toISOString() });
    } catch (err) {
      console.error("[manus-push] Error:", err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // ─── SPA Fallback ─────────────────────────────────────────────────────────
  // All non-API requests return index.html for client-side routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"), (err) => {
      if (err) {
        console.error("[static] index.html not found:", err.message, "distPath:", distPath);
        res.status(404).json({ error: "index.html not found", distPath, cwd: process.cwd() });
      }
    });
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
