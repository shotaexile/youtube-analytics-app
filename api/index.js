"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"));
var import_express2 = require("@trpc/server/adapters/express");

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
var import_drizzle_orm = require("drizzle-orm");
var import_mysql2 = require("drizzle-orm/mysql2");

// drizzle/schema.ts
var import_mysql_core = require("drizzle-orm/mysql-core");
var users = (0, import_mysql_core.mysqlTable)("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: (0, import_mysql_core.varchar)("openId", { length: 64 }).notNull().unique(),
  name: (0, import_mysql_core.text)("name"),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  loginMethod: (0, import_mysql_core.varchar)("loginMethod", { length: 64 }),
  role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: (0, import_mysql_core.timestamp)("lastSignedIn").defaultNow().notNull()
});
var channelConfig = (0, import_mysql_core.mysqlTable)("channel_config", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  channelName: (0, import_mysql_core.varchar)("channelName", { length: 255 }).notNull().default("ViewCore"),
  channelUrl: (0, import_mysql_core.varchar)("channelUrl", { length: 512 }).default(""),
  channelId: (0, import_mysql_core.varchar)("channelId", { length: 128 }).default(""),
  iconUrl: (0, import_mysql_core.text)("iconUrl"),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var videos = (0, import_mysql_core.mysqlTable)("videos", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  videoId: (0, import_mysql_core.varchar)("videoId", { length: 64 }).notNull().unique(),
  title: (0, import_mysql_core.varchar)("title", { length: 512 }).notNull(),
  publishedAt: (0, import_mysql_core.varchar)("publishedAt", { length: 32 }).notNull(),
  publishedDate: (0, import_mysql_core.date)("publishedDate").notNull(),
  duration: (0, import_mysql_core.int)("duration").notNull().default(0),
  views: (0, import_mysql_core.bigint)("views", { mode: "number" }).notNull().default(0),
  estimatedRevenue: (0, import_mysql_core.float)("estimatedRevenue").notNull().default(0),
  impressions: (0, import_mysql_core.bigint)("impressions", { mode: "number" }).notNull().default(0),
  ctr: (0, import_mysql_core.float)("ctr").notNull().default(0),
  avgViewRate: (0, import_mysql_core.float)("avgViewRate").notNull().default(0),
  likeRate: (0, import_mysql_core.float)("likeRate").notNull().default(0),
  subscriberChange: (0, import_mysql_core.int)("subscriberChange").notNull().default(0),
  isShort: (0, import_mysql_core.boolean)("isShort").notNull().default(false),
  isPrivate: (0, import_mysql_core.boolean)("isPrivate").notNull().default(false),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var monthlyStats = (0, import_mysql_core.mysqlTable)("monthly_stats", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  month: (0, import_mysql_core.varchar)("month", { length: 7 }).notNull().unique(),
  views: (0, import_mysql_core.bigint)("views", { mode: "number" }).notNull().default(0),
  revenue: (0, import_mysql_core.float)("revenue").notNull().default(0),
  videoCount: (0, import_mysql_core.int)("videoCount").notNull().default(0),
  subscriberChange: (0, import_mysql_core.int)("subscriberChange").notNull().default(0),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var csvUploads = (0, import_mysql_core.mysqlTable)("csv_uploads", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  uploadedBy: (0, import_mysql_core.varchar)("uploadedBy", { length: 64 }),
  videoCount: (0, import_mysql_core.int)("videoCount").notNull().default(0),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var adminSettings = (0, import_mysql_core.mysqlTable)("admin_settings", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  settingKey: (0, import_mysql_core.varchar)("settingKey", { length: 128 }).notNull().unique(),
  settingValue: (0, import_mysql_core.text)("settingValue"),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var pushTokens = (0, import_mysql_core.mysqlTable)("push_tokens", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  token: (0, import_mysql_core.varchar)("token", { length: 512 }).notNull().unique(),
  deviceName: (0, import_mysql_core.varchar)("deviceName", { length: 128 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
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
      _db = (0, import_mysql2.drizzle)(process.env.DATABASE_URL);
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
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
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
var import_axios = __toESM(require("axios"));
var import_cookie = require("cookie");
var import_jose = require("jose");
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
var createOAuthHttpClient = () => import_axios.default.create({
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
    const parsed = (0, import_cookie.parse)(cookieHeader);
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
    return new import_jose.SignJWT({
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
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
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
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
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
  app2.get("/api/oauth/mobile", async (req, res) => {
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
  app2.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
  app2.post("/api/auth/session", async (req, res) => {
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
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");
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
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
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
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"));
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
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
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
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
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var import_zod3 = require("zod");

// server/analytics-router.ts
var import_zod2 = require("zod");

// server/_core/openai.ts
var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
var OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
async function callOpenAI(options) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-4o-mini",
      messages: options.messages,
      max_tokens: options.maxTokens ?? 1500,
      temperature: options.temperature ?? 0.7
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }
  const data = await response.json();
  return {
    choices: data.choices.map((c) => ({
      message: {
        content: c.message?.content ?? ""
      }
    }))
  };
}

// server/_core/youtube.ts
var YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
var YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
async function searchYouTube(query, maxResults = 5, options = {}) {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not set");
  }
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    regionCode: options.regionCode ?? "JP",
    relevanceLanguage: options.relevanceLanguage ?? "ja",
    order: "viewCount",
    key: YOUTUBE_API_KEY
  });
  const response = await fetch(`${YOUTUBE_BASE_URL}/search?${params}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error: ${response.status} ${error}`);
  }
  const data = await response.json();
  const items = data.items ?? [];
  const videoIds = items.map((item) => item.id?.videoId).filter(Boolean).join(",");
  let statsMap = {};
  if (videoIds) {
    try {
      const statsParams = new URLSearchParams({
        part: "statistics",
        id: videoIds,
        key: YOUTUBE_API_KEY
      });
      const statsResponse = await fetch(`${YOUTUBE_BASE_URL}/videos?${statsParams}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        for (const item of statsData.items ?? []) {
          const count = parseInt(item.statistics?.viewCount ?? "0");
          statsMap[item.id] = count >= 1e4 ? `${Math.round(count / 1e4)}\u4E07\u56DE\u8996\u8074` : `${count.toLocaleString()}\u56DE\u8996\u8074`;
        }
      }
    } catch {
    }
  }
  return items.map((item) => {
    const videoId = item.id?.videoId ?? "";
    const snippet = item.snippet ?? {};
    const publishedAt = snippet.publishedAt ? formatRelativeTime(snippet.publishedAt) : "";
    return {
      videoId,
      title: snippet.title ?? "",
      channel: snippet.channelTitle ?? "",
      views: statsMap[videoId] ?? "",
      publishedAt,
      thumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? "",
      description: snippet.description?.slice(0, 100) ?? ""
    };
  });
}
function formatRelativeTime(isoDate) {
  const date2 = new Date(isoDate);
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date2.getTime();
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffDays < 1) return "\u4ECA\u65E5";
  if (diffDays < 7) return `${diffDays}\u65E5\u524D`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}\u9031\u9593\u524D`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}\u30F6\u6708\u524D`;
  return `${Math.floor(diffDays / 365)}\u5E74\u524D`;
}

// server/analytics-router.ts
var import_drizzle_orm2 = require("drizzle-orm");
var crypto = __toESM(require("crypto"));
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
  uploadCSV: publicProcedure.input(import_zod2.z.object({ csvContent: import_zod2.z.string(), uploadedBy: import_zod2.z.string().optional() })).mutation(async ({ input }) => {
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
    import_zod2.z.object({
      filter: import_zod2.z.enum(["all", "regular", "short", "private"]).optional(),
      sortBy: import_zod2.z.enum(["views", "estimatedRevenue", "publishedDate", "ctr", "likeRate", "avgViewRate", "subscriberChange", "impressions"]).optional(),
      sortOrder: import_zod2.z.enum(["asc", "desc"]).optional(),
      limit: import_zod2.z.number().optional(),
      offset: import_zod2.z.number().optional()
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const { filter = "all", sortBy = "publishedDate", sortOrder = "desc", limit = 600, offset = 0 } = input || {};
    let baseQuery = db.select().from(videos).$dynamic();
    if (filter === "regular") {
      baseQuery = baseQuery.where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(videos.isShort, false), (0, import_drizzle_orm2.eq)(videos.isPrivate, false)));
    } else if (filter === "short") {
      baseQuery = baseQuery.where((0, import_drizzle_orm2.eq)(videos.isShort, true));
    } else if (filter === "private") {
      baseQuery = baseQuery.where((0, import_drizzle_orm2.eq)(videos.isPrivate, true));
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
    baseQuery = baseQuery.orderBy(sortOrder === "asc" ? (0, import_drizzle_orm2.asc)(col) : (0, import_drizzle_orm2.desc)(col));
    return baseQuery.limit(limit).offset(offset);
  }),
  // Get monthly stats
  getMonthlyStats: publicProcedure.input(import_zod2.z.object({ months: import_zod2.z.number().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const { months = 24 } = input || {};
    const rows = await db.select().from(monthlyStats).orderBy((0, import_drizzle_orm2.desc)(monthlyStats.month)).limit(months);
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
    import_zod2.z.object({
      channelName: import_zod2.z.string(),
      channelUrl: import_zod2.z.string().optional(),
      channelId: import_zod2.z.string().optional(),
      iconUrl: import_zod2.z.string().optional()
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
    const rows = await db.select().from(adminSettings).where((0, import_drizzle_orm2.eq)(adminSettings.settingKey, "admin_password_hash"));
    return rows.length > 0 && !!rows[0].settingValue;
  }),
  // Set admin password (first time or reset)
  setAdminPassword: publicProcedure.input(import_zod2.z.object({ password: import_zod2.z.string().min(4) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const hash = crypto.createHash("sha256").update(input.password).digest("hex");
    const existing = await db.select().from(adminSettings).where((0, import_drizzle_orm2.eq)(adminSettings.settingKey, "admin_password_hash"));
    if (existing.length > 0) {
      await db.update(adminSettings).set({ settingValue: hash }).where((0, import_drizzle_orm2.eq)(adminSettings.settingKey, "admin_password_hash"));
    } else {
      await db.insert(adminSettings).values({ settingKey: "admin_password_hash", settingValue: hash });
    }
    return { success: true };
  }),
  // Verify admin password
  verifyAdminPassword: publicProcedure.input(import_zod2.z.object({ password: import_zod2.z.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select().from(adminSettings).where((0, import_drizzle_orm2.eq)(adminSettings.settingKey, "admin_password_hash"));
    if (rows.length === 0 || !rows[0].settingValue) {
      return { valid: true };
    }
    const hash = crypto.createHash("sha256").update(input.password).digest("hex");
    return { valid: hash === rows[0].settingValue };
  }),
  // ── Push token management ─────────────────────────────────────────────────
  // Register push token
  registerPushToken: publicProcedure.input(import_zod2.z.object({ token: import_zod2.z.string(), deviceName: import_zod2.z.string().optional() })).mutation(async ({ input }) => {
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
    const rows = await db.select().from(csvUploads).orderBy((0, import_drizzle_orm2.desc)(csvUploads.createdAt)).limit(1);
    return rows[0] || null;
  }),
  // ── AI Bot ────────────────────────────────────────────────────────────────
  // Answer questions about the channel analytics using LLM
  askBot: publicProcedure.input(import_zod2.z.object({ question: import_zod2.z.string().max(500) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allVideos = await db.select().from(videos).orderBy((0, import_drizzle_orm2.desc)(videos.publishedDate));
    if (allVideos.length === 0) throw new Error("\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002CSV\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    const allMonthly = await db.select().from(monthlyStats).orderBy((0, import_drizzle_orm2.asc)(monthlyStats.month));
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
    const response = await callOpenAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.question }
      ],
      maxTokens: 1500
    });
    const answer = response.choices?.[0]?.message?.content ?? "\u56DE\u7B54\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002";
    return { answer };
  }),
  // ── トレンド企画提案システム ─────────────────────────────────────────────────
  // 日本のYouTubeトレンド動画を取得
  getTrendingVideos: publicProcedure.input(import_zod2.z.object({ category: import_zod2.z.string().optional() })).query(async ({ input }) => {
    const categories = [
      { label: "\u30D3\u30B8\u30CD\u30B9\u30FB\u304A\u91D1", query: "\u65E5\u672C \u30D3\u30B8\u30CD\u30B9 \u304A\u91D1 \u7A3C\u3050 2026" },
      { label: "\u66B4\u9732\u30FB\u708E\u4E0A", query: "\u65E5\u672C \u66B4\u9732 \u708E\u4E0A \u771F\u76F8 2026" },
      { label: "\u8A50\u6B3A\u30FB\u4E8B\u4EF6", query: "\u65E5\u672C \u8A50\u6B3A \u4E8B\u4EF6 \u902E\u6355 2026" },
      { label: "\u6295\u8CC7\u30FB\u526F\u696D", query: "\u65E5\u672C \u6295\u8CC7 \u526F\u696D \u8CC7\u7523 2026" },
      { label: "\u30A8\u30F3\u30BF\u30E1\u30FB\u8A71\u984C", query: "\u65E5\u672C \u8A71\u984C \u30D0\u30BA \u30A8\u30F3\u30BF\u30E1 2026" }
    ];
    const targetCategories = input.category ? categories.filter((c) => c.label === input.category) : categories;
    const results = [];
    for (const cat of targetCategories) {
      try {
        const items = await searchYouTube(cat.query, 5);
        results.push({ category: cat.label, videos: items });
      } catch (e) {
        results.push({ category: cat.label, videos: [] });
      }
    }
    return { trends: results };
  }),
  // AI企画提案を生成
  generateIdeas: publicProcedure.input(import_zod2.z.object({
    selectedTrends: import_zod2.z.array(import_zod2.z.object({
      title: import_zod2.z.string(),
      category: import_zod2.z.string(),
      views: import_zod2.z.string().optional()
    })),
    focusCategory: import_zod2.z.string().optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return { ideas: [], rawText: "", error: "DB not available" };
    const topVideos = await db.select().from(videos).orderBy((0, import_drizzle_orm2.desc)(videos.views)).limit(30);
    const highCtrVideos = await db.select().from(videos).orderBy((0, import_drizzle_orm2.desc)(videos.ctr)).limit(20);
    const channel = await db.select().from(channelConfig).limit(1).then((r) => r[0]);
    const topTitles = topVideos.slice(0, 10).map(
      (v) => `\u300C${v.title}\u300D(${(v.views || 0).toLocaleString()}\u56DE, CTR ${((v.ctr || 0) * 100).toFixed(1)}%)`
    ).join("\n");
    const highCtrTitles = highCtrVideos.slice(0, 10).map(
      (v) => `\u300C${v.title}\u300D(CTR ${((v.ctr || 0) * 100).toFixed(1)}%, ${(v.views || 0).toLocaleString()}\u56DE)`
    ).join("\n");
    const avgCtr = topVideos.length > 0 ? topVideos.reduce((s, v) => s + (v.ctr || 0), 0) / topVideos.length : 0;
    const trendContext = input.selectedTrends.map((t2) => `\u30FB${t2.category}: \u300C${t2.title}\u300D`).join("\n");
    const systemPrompt = `\u3042\u306A\u305F\u306F\u300C${channel?.channelName || "\u4E09\u5D0E\u512A\u592A"}\u300D\u306EYouTube\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u5C02\u5C5E\u30B3\u30F3\u30C6\u30F3\u30C4\u30B9\u30C8\u30E9\u30C6\u30B8\u30B9\u30C8\u3067\u3059\u3002

\u3010\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u7279\u5FB4\u3068\u5F37\u307F\u3011
- \u30D3\u30B8\u30CD\u30B9\u30FB\u304A\u91D1\u30FB\u6295\u8CC7\u30FB\u8A50\u6B3A\u66B4\u9732\u30FB\u793E\u4F1A\u554F\u984C\u306B\u5F37\u3044
- \u5B9F\u696D\u5BB6\u30FB\u8D77\u696D\u5BB6\u3068\u3057\u3066\u306E\u5B9F\u4F53\u9A13\u3068\u4FE1\u983C\u6027\u304C\u3042\u308B
- \u8996\u8074\u8005\u5C64: 20\u301C40\u4EE3\u306E\u7537\u6027\u3001\u30D3\u30B8\u30CD\u30B9\u306B\u95A2\u5FC3\u304C\u3042\u308B\u5C64
- \u30C1\u30E3\u30F3\u30CD\u30EB\u5E73\u5747CTR: ${(avgCtr * 100).toFixed(1)}%

\u3010\u904E\u53BB\u306E\u8996\u8074\u56DE\u6570TOP10\u52D5\u753B\uFF08\u52DD\u3061\u30D1\u30BF\u30FC\u30F3\uFF09\u3011
${topTitles}

\u3010\u904E\u53BB\u306E\u9AD8CTR TOP10\u52D5\u753B\uFF08\u30AF\u30EA\u30C3\u30AF\u3055\u308C\u3084\u3059\u3044\u30D1\u30BF\u30FC\u30F3\uFF09\u3011
${highCtrTitles}

\u3010\u73FE\u5728\u306EYouTube\u30C8\u30EC\u30F3\u30C9\uFF08\u65E5\u672C\uFF09\u3011
${trendContext}

\u4E0A\u8A18\u306E\u30C8\u30EC\u30F3\u30C9\u3068\u904E\u53BB\u306E\u52DD\u3061\u30D1\u30BF\u30FC\u30F3\u3092\u7D44\u307F\u5408\u308F\u305B\u3066\u3001${channel?.channelName || "\u4E09\u5D0E\u512A\u592A"}\u304C\u3084\u308B\u3068\u30D0\u30BA\u308B\u4F01\u753B\u30923\u672C\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u5FC5\u305A\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u4ED6\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u4E00\u5207\u4E0D\u8981\uFF09:
{
  "ideas": [
    {
      "title": "\u4F01\u753B\u30BF\u30A4\u30C8\u30EB\uFF0830\u6587\u5B57\u4EE5\u5185\uFF09",
      "concept": "\u4F01\u753B\u306E\u6982\u8981\uFF08100\u6587\u5B57\u4EE5\u5185\uFF09",
      "titleOptions": ["\u30BF\u30A4\u30C8\u30EB\u68481", "\u30BF\u30A4\u30C8\u30EB\u68482", "\u30BF\u30A4\u30C8\u30EB\u68483"],
      "thumbnailConcept": "\u30B5\u30E0\u30CD\u30A4\u30EB\u306E\u69CB\u6210\u6848\uFF08\u80CC\u666F\u8272\u30FB\u30C6\u30AD\u30B9\u30C8\u30FB\u8868\u60C5\u30FB\u69CB\u56F3\uFF09",
      "whyBuzz": "\u306A\u305C\u30D0\u30BA\u308B\u304B\uFF08\u904E\u53BB\u30C7\u30FC\u30BF\u3068\u306E\u95A2\u9023\u6027\uFF09",
      "buzzScore": 85,
      "estimatedCtr": "7.5%",
      "category": "\u30D3\u30B8\u30CD\u30B9",
      "trendKeyword": "\u53C2\u7167\u3057\u305F\u30C8\u30EC\u30F3\u30C9\u30AD\u30FC\u30EF\u30FC\u30C9"
    }
  ]
}`;
    const response = await callOpenAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "\u30C8\u30EC\u30F3\u30C9\u3092\u5206\u6790\u3057\u3066\u3001\u30D0\u30BA\u308B\u4F01\u753B\u30923\u672C\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }
      ],
      maxTokens: 2e3,
      model: "gpt-4o"
    });
    const text2 = response.choices?.[0]?.message?.content ?? "";
    try {
      const jsonMatch = text2.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);
      return { ideas: parsed.ideas || [], rawText: text2 };
    } catch (e) {
      return { ideas: [], rawText: text2, error: "JSON parse failed" };
    }
  }),
  // 特定のトレンドキーワードで深掘り検索
  searchTrendDetail: publicProcedure.input(import_zod2.z.object({ keyword: import_zod2.z.string() })).query(async ({ input }) => {
    try {
      const items = await searchYouTube(input.keyword + " \u65E5\u672C", 10);
      return { videos: items };
    } catch (e) {
      return { videos: [] };
    }
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
    channelInfo: publicProcedure.input(import_zod3.z.object({ channelUrl: import_zod3.z.string() })).query(async ({ input }) => {
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

// api/index.ts
var app = (0, import_express.default)();
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
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});
app.use(
  "/api/trpc",
  (0, import_express2.createExpressMiddleware)({
    router: appRouter,
    createContext
  })
);
var index_default = app;
// Vercel Serverless Function requires a handler function, not an Express app instance directly
module.exports = (req, res) => app(req, res);
