// server/_core/index.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  bigint,
  boolean,
  date
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var channelConfig = mysqlTable("channel_config", {
  id: int("id").autoincrement().primaryKey(),
  channelName: varchar("channelName", { length: 255 }).notNull().default("ViewCore"),
  channelUrl: varchar("channelUrl", { length: 512 }).default(""),
  channelId: varchar("channelId", { length: 128 }).default(""),
  iconUrl: text("iconUrl"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  publishedAt: varchar("publishedAt", { length: 32 }).notNull(),
  publishedDate: date("publishedDate").notNull(),
  duration: int("duration").notNull().default(0),
  views: bigint("views", { mode: "number" }).notNull().default(0),
  estimatedRevenue: float("estimatedRevenue").notNull().default(0),
  impressions: bigint("impressions", { mode: "number" }).notNull().default(0),
  ctr: float("ctr").notNull().default(0),
  avgViewRate: float("avgViewRate").notNull().default(0),
  likeRate: float("likeRate").notNull().default(0),
  subscriberChange: int("subscriberChange").notNull().default(0),
  isShort: boolean("isShort").notNull().default(false),
  isPrivate: boolean("isPrivate").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var monthlyStats = mysqlTable("monthly_stats", {
  id: int("id").autoincrement().primaryKey(),
  month: varchar("month", { length: 7 }).notNull().unique(),
  views: bigint("views", { mode: "number" }).notNull().default(0),
  revenue: float("revenue").notNull().default(0),
  videoCount: int("videoCount").notNull().default(0),
  subscriberChange: int("subscriberChange").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var csvUploads = mysqlTable("csv_uploads", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: varchar("uploadedBy", { length: 64 }),
  videoCount: int("videoCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var adminSettings = mysqlTable("admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  deviceName: varchar("deviceName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getParentDomain(hostname) {
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) {
    return void 0;
  }
  return "." + parts.slice(-2).join(".");
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(EXCHANGE_TOKEN_PATH, payload);
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(GET_USER_INFO_PATH, {
      accessToken: token.accessToken
    });
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(platforms.filter((p) => typeof p === "string"));
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
async function syncUser(userInfo) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }
  const lastSignedIn = /* @__PURE__ */ new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return saved ?? {
    openId: userInfo.openId,
    name: userInfo.name,
    email: userInfo.email,
    loginMethod: userInfo.loginMethod ?? null,
    lastSignedIn
  };
}
function buildUserResponse(user) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString()
  };
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const frontendUrl = process.env.EXPO_WEB_PREVIEW_URL || process.env.EXPO_PACKAGER_PROXY_URL || "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
  app.get("/api/oauth/mobile", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user)
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
  app.post("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("webdevtoken.v1.WebDevService/SendNotification", normalizedBase).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z3 } from "zod";

// server/analytics-router.ts
import { z as z2 } from "zod";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    budget_tokens: 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`);
  }
  return await response.json();
}

// server/analytics-router.ts
import { eq as eq2, desc, asc, and } from "drizzle-orm";
import * as crypto from "crypto";
async function sendExpoPushNotifications(tokens, title, body) {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: { type: "csv_update" }
  }));
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages)
    });
  } catch (e) {
    console.warn("Push notification send failed:", e);
  }
}
var MONTH_MAP = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11
};
function parseDate(dateStr) {
  if (!dateStr) return /* @__PURE__ */ new Date(0);
  const engMatch = dateStr.match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (engMatch) {
    const month = MONTH_MAP[engMatch[1]];
    const day = parseInt(engMatch[2]);
    const year = parseInt(engMatch[3]);
    if (month !== void 0 && !isNaN(day) && !isNaN(year))
      return new Date(year, month, day);
  }
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch)
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? /* @__PURE__ */ new Date(0) : d;
}
function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
function parseCSVToVideos(csvContent) {
  const allLines = csvContent.split("\n");
  const lines = allLines.slice(1).filter((l) => !l.startsWith("\u5408\u8A08"));
  const result = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 11) continue;
    const rawId = cols[0]?.trim();
    const title = cols[1]?.trim();
    const publishedAt = cols[2]?.trim();
    const durationRaw = cols[3]?.trim();
    let duration = 0;
    if (durationRaw.includes(":")) {
      const parts = durationRaw.split(":");
      if (parts.length === 3) duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      else if (parts.length === 2) duration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      duration = parseInt(durationRaw) || 0;
    }
    const likeRate = parseFloat(cols[4]) || 0;
    const avgViewRate = parseFloat(cols[5]) || 0;
    const views = parseInt(cols[6]) || 0;
    const subscriberChange = parseInt(cols[7]) || 0;
    const estimatedRevenue = parseFloat(cols[8]) || 0;
    const impressions = parseInt(cols[9]) || 0;
    const ctr = parseFloat(cols[10]) || 0;
    if (!rawId || !title) continue;
    if (rawId === "\u5408\u8A08" || rawId.replace(/^\s+/, "").length !== 11) continue;
    const isShort = duration > 0 && duration <= 60;
    const isPrivate = rawId.startsWith(" ") || rawId.startsWith("-");
    const videoId = rawId.replace(/^\s+/, "");
    const publishedDate = parseDate(publishedAt);
    result.push({
      videoId,
      title,
      publishedAt,
      publishedDate: formatDateStr(publishedDate),
      duration,
      views,
      estimatedRevenue,
      impressions,
      ctr,
      avgViewRate,
      likeRate,
      subscriberChange,
      isShort,
      isPrivate
    });
  }
  return result;
}
function buildMonthlyStats(videoRows) {
  const map = /* @__PURE__ */ new Map();
  for (const v of videoRows) {
    const d = parseDate(v.publishedAt);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(month);
    if (existing) {
      existing.views += v.views || 0;
      existing.revenue += v.estimatedRevenue || 0;
      existing.videoCount += 1;
      existing.subscriberChange += v.subscriberChange || 0;
    } else {
      map.set(month, {
        views: v.views || 0,
        revenue: v.estimatedRevenue || 0,
        videoCount: 1,
        subscriberChange: v.subscriberChange || 0
      });
    }
  }
  return Array.from(map.entries()).map(([month, stats]) => ({ month, ...stats }));
}
async function checkIsPrivate(videoId) {
  try {
    const url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    const res = await fetch(url, { method: "HEAD" });
    return res.status === 404;
  } catch {
    return false;
  }
}
async function checkPrivacyInBatches(videoIds, batchSize = 20) {
  const privateIds = /* @__PURE__ */ new Set();
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (id) => ({ id, isPrivate: await checkIsPrivate(id) }))
    );
    for (const { id, isPrivate } of results) {
      if (isPrivate) privateIds.add(id);
    }
  }
  return privateIds;
}
var analyticsRouter = router({
  // Upload CSV and store to DB
  uploadCSV: publicProcedure.input(z2.object({ csvContent: z2.string(), uploadedBy: z2.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const videoRows = parseCSVToVideos(input.csvContent);
    if (videoRows.length === 0) throw new Error("No valid video data found in CSV");
    const allVideoIds = videoRows.map((v) => v.videoId);
    const privateIds = await checkPrivacyInBatches(allVideoIds, 20);
    for (const v of videoRows) {
      v.isPrivate = privateIds.has(v.videoId);
      if (v.isPrivate) v.isShort = false;
    }
    for (const v of videoRows) {
      await db.insert(videos).values(v).onDuplicateKeyUpdate({
        set: {
          title: v.title,
          publishedAt: v.publishedAt,
          publishedDate: v.publishedDate,
          duration: v.duration,
          views: v.views,
          estimatedRevenue: v.estimatedRevenue,
          impressions: v.impressions,
          ctr: v.ctr,
          avgViewRate: v.avgViewRate,
          likeRate: v.likeRate,
          subscriberChange: v.subscriberChange,
          isShort: v.isShort,
          isPrivate: v.isPrivate
        }
      });
    }
    const statsRows = buildMonthlyStats(videoRows);
    for (const s of statsRows) {
      await db.insert(monthlyStats).values(s).onDuplicateKeyUpdate({
        set: {
          views: s.views,
          revenue: s.revenue,
          videoCount: s.videoCount,
          subscriberChange: s.subscriberChange
        }
      });
    }
    await db.insert(csvUploads).values({
      uploadedBy: input.uploadedBy ?? null,
      videoCount: videoRows.length
    });
    const tokenRows = await db.select().from(pushTokens);
    const tokens = tokenRows.map((r) => r.token).filter(Boolean);
    if (tokens.length > 0) {
      const uploader = input.uploadedBy || "\u30C1\u30FC\u30E0\u30E1\u30F3\u30D0\u30FC";
      await sendExpoPushNotifications(
        tokens,
        "\u{1F4CA} ViewCore \u30C7\u30FC\u30BF\u66F4\u65B0",
        `${uploader}\u304CCSV\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u307E\u3057\u305F\uFF08${videoRows.length}\u672C\uFF09\u3002\u6700\u65B0\u30C7\u30FC\u30BF\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002`
      );
    }
    return { success: true, videoCount: videoRows.length };
  }),
  // Get all videos
  getVideos: publicProcedure.input(
    z2.object({
      filter: z2.enum(["all", "regular", "short", "private"]).optional(),
      sortBy: z2.enum(["views", "estimatedRevenue", "publishedDate", "ctr", "likeRate", "avgViewRate", "subscriberChange", "impressions"]).optional(),
      sortOrder: z2.enum(["asc", "desc"]).optional(),
      limit: z2.number().optional(),
      offset: z2.number().optional()
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const { filter = "all", sortBy = "publishedDate", sortOrder = "desc", limit = 600, offset = 0 } = input || {};
    let baseQuery = db.select().from(videos).$dynamic();
    if (filter === "regular") {
      baseQuery = baseQuery.where(and(eq2(videos.isShort, false), eq2(videos.isPrivate, false)));
    } else if (filter === "short") {
      baseQuery = baseQuery.where(eq2(videos.isShort, true));
    } else if (filter === "private") {
      baseQuery = baseQuery.where(eq2(videos.isPrivate, true));
    }
    const colMap = {
      views: videos.views,
      estimatedRevenue: videos.estimatedRevenue,
      publishedDate: videos.publishedDate,
      ctr: videos.ctr,
      likeRate: videos.likeRate,
      avgViewRate: videos.avgViewRate,
      subscriberChange: videos.subscriberChange,
      impressions: videos.impressions
    };
    const col = colMap[sortBy] || videos.publishedDate;
    baseQuery = baseQuery.orderBy(sortOrder === "asc" ? asc(col) : desc(col));
    return baseQuery.limit(limit).offset(offset);
  }),
  // Get monthly stats
  getMonthlyStats: publicProcedure.input(z2.object({ months: z2.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const { months = 24 } = input || {};
    const rows = await db.select().from(monthlyStats).orderBy(desc(monthlyStats.month)).limit(months);
    return rows.reverse();
  }),
  // Get channel summary (aggregated)
  getChannelSummary: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const allVideos = await db.select().from(videos);
    if (allVideos.length === 0) return null;
    const regularVideos = allVideos.filter((v) => !v.isShort && !v.isPrivate);
    const shortVideos = allVideos.filter((v) => v.isShort);
    const privateVideos = allVideos.filter((v) => v.isPrivate);
    const validRevenue = allVideos.filter((v) => v.estimatedRevenue > 0);
    return {
      totalViews: allVideos.reduce((s, v) => s + v.views, 0),
      totalRevenue: validRevenue.reduce((s, v) => s + v.estimatedRevenue, 0),
      totalImpressions: allVideos.reduce((s, v) => s + v.impressions, 0),
      avgCtr: allVideos.length > 0 ? allVideos.reduce((s, v) => s + v.ctr, 0) / allVideos.length : 0,
      avgLikeRate: allVideos.length > 0 ? allVideos.reduce((s, v) => s + v.likeRate, 0) / allVideos.length : 0,
      avgViewRate: allVideos.length > 0 ? allVideos.reduce((s, v) => s + v.avgViewRate, 0) / allVideos.length : 0,
      totalSubscriberChange: allVideos.reduce((s, v) => s + v.subscriberChange, 0),
      videoCount: allVideos.length,
      shortCount: shortVideos.length,
      regularCount: regularVideos.length,
      privateCount: privateVideos.length
    };
  }),
  // Get channel config
  getChannelConfig: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(channelConfig).limit(1);
    return rows[0] || null;
  }),
  // Save channel config
  saveChannelConfig: publicProcedure.input(
    z2.object({
      channelName: z2.string(),
      channelUrl: z2.string().optional(),
      channelId: z2.string().optional(),
      iconUrl: z2.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existing = await db.select().from(channelConfig).limit(1);
    if (existing.length > 0) {
      await db.update(channelConfig).set({
        channelName: input.channelName,
        channelUrl: input.channelUrl || "",
        channelId: input.channelId || "",
        iconUrl: input.iconUrl || null
      });
    } else {
      await db.insert(channelConfig).values({
        channelName: input.channelName,
        channelUrl: input.channelUrl || "",
        channelId: input.channelId || "",
        iconUrl: input.iconUrl || null
      });
    }
    return { success: true };
  }),
  // ── Admin password management ────────────────────────────────────────────
  // Check if admin password is set
  hasAdminPassword: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return false;
    const rows = await db.select().from(adminSettings).where(eq2(adminSettings.settingKey, "admin_password_hash"));
    return rows.length > 0 && !!rows[0].settingValue;
  }),
  // Set admin password (first time or reset)
  setAdminPassword: publicProcedure.input(z2.object({ password: z2.string().min(4) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const hash = crypto.createHash("sha256").update(input.password).digest("hex");
    const existing = await db.select().from(adminSettings).where(eq2(adminSettings.settingKey, "admin_password_hash"));
    if (existing.length > 0) {
      await db.update(adminSettings).set({ settingValue: hash }).where(eq2(adminSettings.settingKey, "admin_password_hash"));
    } else {
      await db.insert(adminSettings).values({ settingKey: "admin_password_hash", settingValue: hash });
    }
    return { success: true };
  }),
  // Verify admin password
  verifyAdminPassword: publicProcedure.input(z2.object({ password: z2.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select().from(adminSettings).where(eq2(adminSettings.settingKey, "admin_password_hash"));
    if (rows.length === 0 || !rows[0].settingValue) {
      return { valid: true };
    }
    const hash = crypto.createHash("sha256").update(input.password).digest("hex");
    return { valid: hash === rows[0].settingValue };
  }),
  // ── Push token management ─────────────────────────────────────────────────
  // Register push token
  registerPushToken: publicProcedure.input(z2.object({ token: z2.string(), deviceName: z2.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db.insert(pushTokens).values({ token: input.token, deviceName: input.deviceName || null }).onDuplicateKeyUpdate({ set: { deviceName: input.deviceName || null } });
    return { success: true };
  }),
  // Check if DB has data
  hasData: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return false;
    const rows = await db.select().from(videos).limit(1);
    return rows.length > 0;
  }),
  // Get last upload info
  getLastUpload: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(csvUploads).orderBy(desc(csvUploads.createdAt)).limit(1);
    return rows[0] || null;
  }),
  // ── AI Bot ────────────────────────────────────────────────────────────────
  // Answer questions about the channel analytics using LLM
  askBot: publicProcedure.input(z2.object({ question: z2.string().max(500) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allVideos = await db.select().from(videos).orderBy(desc(videos.publishedDate));
    if (allVideos.length === 0) throw new Error("\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002CSV\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    const allMonthly = await db.select().from(monthlyStats).orderBy(asc(monthlyStats.month));
    const channelRows = await db.select().from(channelConfig).limit(1);
    const channel = channelRows[0];
    const totalVideos = allVideos.length;
    const publicVideos = allVideos.filter((v) => !v.isPrivate);
    const shortVideos = publicVideos.filter((v) => v.isShort);
    const regularVideos = publicVideos.filter((v) => !v.isShort);
    const totalViews = publicVideos.reduce((s, v) => s + v.views, 0);
    const totalRevenue = publicVideos.reduce((s, v) => s + v.estimatedRevenue, 0);
    const totalSubscriberChange = publicVideos.reduce((s, v) => s + v.subscriberChange, 0);
    const avgCtr = publicVideos.length > 0 ? publicVideos.reduce((s, v) => s + v.ctr, 0) / publicVideos.length : 0;
    const avgViewRate = publicVideos.length > 0 ? publicVideos.reduce((s, v) => s + v.avgViewRate, 0) / publicVideos.length : 0;
    const top10 = [...publicVideos].sort((a, b) => b.views - a.views).slice(0, 10).map((v) => `  - \u300C${v.title}\u300D \u518D\u751F:${v.views.toLocaleString()} CTR:${(v.ctr * 100).toFixed(1)}% \u8996\u8074\u7DAD\u6301\u7387:${(v.avgViewRate * 100).toFixed(1)}% \u767B\u9332\u8005\u5897\u6E1B:${v.subscriberChange > 0 ? "+" : ""}${v.subscriberChange} ${v.isShort ? "[\u30B7\u30E7\u30FC\u30C8]" : "[\u901A\u5E38]"} \u6295\u7A3F:${v.publishedAt}`);
    const monthlySummary = allMonthly.map(
      (m) => `  ${m.month}: \u518D\u751F${m.views.toLocaleString()} \u53CE\u76CA\xA5${Math.round(m.revenue).toLocaleString()} \u6295\u7A3F${m.videoCount}\u672C \u767B\u9332\u8005${m.subscriberChange > 0 ? "+" : ""}${m.subscriberChange}`
    );
    const recent5 = allVideos.slice(0, 5).map(
      (v) => `  - \u300C${v.title}\u300D \u518D\u751F:${v.views.toLocaleString()} \u6295\u7A3F:${v.publishedAt} ${v.isShort ? "[\u30B7\u30E7\u30FC\u30C8]" : "[\u901A\u5E38]"}`
    );
    const systemPrompt = `\u3042\u306A\u305F\u306F\u300C${channel?.channelName || "ViewCore"}\u300D\u3068\u3044\u3046YouTube\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u5C02\u5C5E\u30A2\u30CA\u30EA\u30B9\u30C8\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u30C1\u30E3\u30F3\u30CD\u30EB\u30C7\u30FC\u30BF\u3092\u5143\u306B\u3001\u30C1\u30FC\u30E0\u30E1\u30F3\u30D0\u30FC\u306E\u8CEA\u554F\u306B\u65E5\u672C\u8A9E\u3067\u5177\u4F53\u7684\u30FB\u7C21\u6F54\u306B\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u6570\u5024\u306F\u5FC5\u305A\u5B9F\u969B\u306E\u30C7\u30FC\u30BF\u3092\u4F7F\u7528\u3057\u3001\u63A8\u6E2C\u3084\u4E00\u822C\u8AD6\u306F\u907F\u3051\u3066\u304F\u3060\u3055\u3044\u3002
\u56DE\u7B54\u306F3\u301C5\u6587\u7A0B\u5EA6\u3067\u307E\u3068\u3081\u3001\u91CD\u8981\u306A\u6570\u5024\u3092\u592A\u5B57\uFF08**\u6570\u5024**\uFF09\u3067\u5F37\u8ABF\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30C1\u30E3\u30F3\u30CD\u30EB\u6982\u8981\u3011
- \u30C1\u30E3\u30F3\u30CD\u30EB\u540D: ${channel?.channelName || "\u4E0D\u660E"}
- \u7DCF\u52D5\u753B\u6570: ${totalVideos}\u672C\uFF08\u516C\u958B: ${publicVideos.length}\u672C\u3001\u30B7\u30E7\u30FC\u30C8: ${shortVideos.length}\u672C\u3001\u901A\u5E38: ${regularVideos.length}\u672C\uFF09
- \u7DCF\u518D\u751F\u6570: ${totalViews.toLocaleString()}
- \u7DCF\u53CE\u76CA: \xA5${Math.round(totalRevenue).toLocaleString()}
- \u7DCF\u767B\u9332\u8005\u5897\u6E1B: ${totalSubscriberChange > 0 ? "+" : ""}${totalSubscriberChange.toLocaleString()}
- \u5E73\u5747CTR: ${(avgCtr * 100).toFixed(2)}%
- \u5E73\u5747\u8996\u8074\u7DAD\u6301\u7387: ${(avgViewRate * 100).toFixed(1)}%

\u3010\u6708\u5225\u30C7\u30FC\u30BF\u3011
${monthlySummary.join("\n")}

\u3010\u518D\u751F\u6570\u30C8\u30C3\u30D710\u52D5\u753B\u3011
${top10.join("\n")}

\u3010\u6700\u65B05\u672C\u306E\u52D5\u753B\u3011
${recent5.join("\n")}`;
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.question }
      ]
    });
    const rawContent = response.choices?.[0]?.message?.content;
    const answer = typeof rawContent === "string" ? rawContent : Array.isArray(rawContent) ? rawContent.map((c) => c.text ?? "").join("") : "\u56DE\u7B54\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002";
    return { answer };
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  youtube: router({
    // Fetch channel info (name + avatar) from YouTube's internal API
    channelInfo: publicProcedure.input(z3.object({ channelUrl: z3.string() })).query(async ({ input }) => {
      const { channelUrl } = input;
      let browseId = "";
      let handle = "";
      const handleMatch = channelUrl.match(/youtube\.com\/@([^/?&]+)/);
      if (handleMatch) {
        handle = handleMatch[1];
      }
      const channelIdMatch = channelUrl.match(/youtube\.com\/channel\/(UC[^/?&]+)/);
      if (channelIdMatch) {
        browseId = channelIdMatch[1];
      }
      if (!handle && !browseId) {
        throw new Error("Invalid YouTube channel URL");
      }
      if (handle && !browseId) {
        try {
          const resolveRes = await fetch(
            "https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-YouTube-Client-Name": "1",
                "X-YouTube-Client-Version": "2.20260305.01.00",
                "Origin": "https://www.youtube.com",
                "Referer": "https://www.youtube.com/"
              },
              body: JSON.stringify({
                browseId: `@${handle}`,
                context: {
                  client: {
                    clientName: "WEB",
                    clientVersion: "2.20260305.01.00",
                    hl: "ja",
                    gl: "JP"
                  }
                }
              })
            }
          );
          if (resolveRes.ok) {
            const data = await resolveRes.json();
            const metadata = data?.metadata?.channelMetadataRenderer;
            const header = data?.header?.c4TabbedHeaderRenderer;
            const channelName = metadata?.title || header?.title || handle;
            const thumbnails = header?.avatar?.thumbnails || [];
            const iconUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : "";
            const channelId = metadata?.externalId || "";
            return { channelName, iconUrl, channelId };
          }
        } catch (e) {
        }
      }
      if (browseId) {
        try {
          const browseRes = await fetch(
            "https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-YouTube-Client-Name": "1",
                "X-YouTube-Client-Version": "2.20260305.01.00",
                "Origin": "https://www.youtube.com",
                "Referer": "https://www.youtube.com/"
              },
              body: JSON.stringify({
                browseId,
                context: {
                  client: {
                    clientName: "WEB",
                    clientVersion: "2.20260305.01.00",
                    hl: "ja",
                    gl: "JP"
                  }
                }
              })
            }
          );
          if (browseRes.ok) {
            const data = await browseRes.json();
            const metadata = data?.metadata?.channelMetadataRenderer;
            const header = data?.header?.c4TabbedHeaderRenderer;
            const channelName = metadata?.title || header?.title || browseId;
            const thumbnails = header?.avatar?.thumbnails || [];
            const iconUrl = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : "";
            return { channelName, iconUrl, channelId: browseId };
          }
        } catch (e) {
        }
      }
      return { channelName: handle || browseId, iconUrl: "", channelId: browseId };
    })
  }),
  analytics: analyticsRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
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
      createContext
    })
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
