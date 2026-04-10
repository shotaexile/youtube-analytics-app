import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { aiInfoRouter } from "../ai-info-router";

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

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

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

// ─── Daily AI Info Scheduler ───────────────────────────────────────────────
// Runs every day at 07:00 JST (22:00 UTC previous day)
function scheduleDailyAiUpdate() {
  const now = new Date();
  // Calculate next 07:00 JST (UTC+9 = UTC-9h offset)
  const nextRun = new Date();
  nextRun.setUTCHours(22, 0, 0, 0); // 22:00 UTC = 07:00 JST
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }
  const msUntilNext = nextRun.getTime() - now.getTime();
  const hoursUntil = Math.round(msUntilNext / 1000 / 60 / 60 * 10) / 10;
  console.log(`[scheduler] Next AI info update in ${hoursUntil}h (${nextRun.toISOString()})`);

  setTimeout(async () => {
    console.log("[scheduler] Running daily AI info update...");
    try {
      // Call generateReport mutation directly via the router caller
      const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null });
      const result = await caller.aiInfo.generateReport();
      console.log(`[scheduler] AI info update complete:`, result);
    } catch (err) {
      console.error("[scheduler] AI info update failed:", err);
    }
    // Schedule next run
    scheduleDailyAiUpdate();
  }, msUntilNext);
}

scheduleDailyAiUpdate();
