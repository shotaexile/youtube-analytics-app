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
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
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

// api/handler.ts
var handler_exports = {};
__export(handler_exports, {
  default: () => handler_default
});
module.exports = __toCommonJS(handler_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"));
var import_path = __toESM(require("path"));
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
var videoEarlyStats = (0, import_mysql_core.mysqlTable)("video_early_stats", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  videoId: (0, import_mysql_core.varchar)("videoId", { length: 64 }).notNull(),
  timeWindow: (0, import_mysql_core.mysqlEnum)("timeWindow", ["1h", "24h", "48h", "1week"]).notNull(),
  views: (0, import_mysql_core.bigint)("views", { mode: "number" }).notNull().default(0),
  impressions: (0, import_mysql_core.bigint)("impressions", { mode: "number" }).notNull().default(0),
  ctr: (0, import_mysql_core.float)("ctr").notNull().default(0),
  avgViewRate: (0, import_mysql_core.float)("avgViewRate").notNull().default(0),
  avgWatchTimeSec: (0, import_mysql_core.int)("avgWatchTimeSec").notNull().default(0),
  likeRate: (0, import_mysql_core.float)("likeRate").notNull().default(0),
  recordedAt: (0, import_mysql_core.timestamp)("recordedAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => ({
  uqVideoTimeWindow: (0, import_mysql_core.uniqueIndex)("uq_video_timewindow").on(table.videoId, table.timeWindow)
}));
var aiDailyReport = (0, import_mysql_core.mysqlTable)("ai_daily_report", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  reportDate: (0, import_mysql_core.date)("reportDate").notNull().unique(),
  // JSON string: { title, summary, source, category }[]
  latestNews: (0, import_mysql_core.text)("latestNews"),
  // JSON string: { rank, toolName, category, description, examples }[]
  toolRankings: (0, import_mysql_core.text)("toolRankings"),
  // JSON string: { toolName, category, useCases, tips }[]
  videoAiTools: (0, import_mysql_core.text)("videoAiTools"),
  // JSON string: { title, url, publishedAt }[] from ledge.ai
  ledgeNews: (0, import_mysql_core.text)("ledgeNews"),
  generatedAt: (0, import_mysql_core.timestamp)("generatedAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
});
var infoSources = (0, import_mysql_core.mysqlTable)("info_sources", {
  id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
  category: (0, import_mysql_core.mysqlEnum)("category", ["youtube", "x", "website"]).notNull().default("website"),
  title: (0, import_mysql_core.varchar)("title", { length: 255 }).notNull(),
  url: (0, import_mysql_core.varchar)("url", { length: 512 }).notNull(),
  memo: (0, import_mysql_core.text)("memo"),
  sortOrder: (0, import_mysql_core.int)("sortOrder").notNull().default(0),
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
async function getLatestAiDailyReport() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(aiDailyReport).orderBy((0, import_drizzle_orm.desc)(aiDailyReport.reportDate)).limit(1);
  return rows[0] ?? null;
}
async function getInfoSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(infoSources).orderBy((0, import_drizzle_orm.asc)(infoSources.category), (0, import_drizzle_orm.asc)(infoSources.sortOrder), (0, import_drizzle_orm.asc)(infoSources.id));
}
async function addInfoSource(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(infoSources).values({
    category: data.category,
    title: data.title,
    url: data.url,
    memo: data.memo ?? null,
    sortOrder: 999
  });
  return result;
}
async function updateInfoSourceMemo(id, memo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(infoSources).set({ memo }).where((0, import_drizzle_orm.eq)(infoSources.id, id));
}
async function deleteInfoSource(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(infoSources).where((0, import_drizzle_orm.eq)(infoSources.id, id));
}
async function seedDefaultInfoSources() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: infoSources.id }).from(infoSources).limit(1);
  if (existing.length > 0) return;
  const defaults = [
    // YouTube
    { category: "youtube", title: "KEITO\u3010AI&WEB ch\u3011", url: "https://www.youtube.com/@keitoaiweb", sortOrder: 1 },
    { category: "youtube", title: "\u52D5\u753B\u7DE8\u96C6\u306E\u4E2D\u306E\u4EBA", url: "https://www.youtube.com/@%E5%8B%95%E7%94%BB%E7%B7%A8%E9%9B%86%E3%81%AE%E4%B8%AD%E3%81%AE%E4%BA%BA", sortOrder: 2 },
    { category: "youtube", title: "AI\u69D8\u306E\u4E0B\u50D5", url: "https://www.youtube.com/@AI-geboku", sortOrder: 3 },
    { category: "youtube", title: "AI\u5927\u5B66\u3010AI&ChatGPT\u6700\u65B0\u60C5\u5831\u3011", url: "https://www.youtube.com/@AIAIChatGPT-cj4sh/videos", sortOrder: 4 },
    { category: "youtube", title: "\u30C1\u30E3\u30A8\u30F3\u3010AI\u7814\u7A76\u6240\u3011\uFF5E\u4ED5\u4E8B\u3067\u4F7F\u3048\u308B\u6700\u65B0\u306EAI\u60C5\u5831\u3092\u767A\u4FE1\uFF5E By\u30C7\u30B8\u30E9\u30A4\u30BA", url: "https://www.youtube.com/@chaen-ai-lab", sortOrder: 5 },
    { category: "youtube", title: "\u3044\u3051\u3068\u3082ch", url: "https://www.youtube.com/@iketomo-ch/videos", sortOrder: 6 },
    // X
    { category: "x", title: "Ledge.ai | AI\u30C8\u30EC\u30F3\u30C9\u306E\u9271\u8106", url: "https://x.com/ledgeai?s=20", sortOrder: 1 },
    { category: "x", title: "AI\u69D8\u306E\u4E0B\u50D5", url: "https://x.com/aigeboku?s=20", sortOrder: 2 },
    // Website
    { category: "website", title: "There's An AI For That (TAAFT)", url: "https://theresanaiforthat.com/", sortOrder: 1 },
    { category: "website", title: "Artificial Analysis", url: "https://artificialanalysis.ai/#media-leaderboards", sortOrder: 2 },
    { category: "website", title: "AIsmiley", url: "https://aismiley.co.jp/", sortOrder: 3 },
    { category: "website", title: "Ladge.ai", url: "https://ledge.ai/", sortOrder: 4 }
  ];
  await db.insert(infoSources).values(defaults);
}
async function upsertAiDailyReport(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const dateStr = data.reportDate instanceof Date ? data.reportDate.toISOString().split("T")[0] : String(data.reportDate);
  const existing = await db.select({ id: aiDailyReport.id }).from(aiDailyReport).where((0, import_drizzle_orm.eq)(aiDailyReport.reportDate, dateStr)).limit(1);
  if (existing.length > 0) {
    await db.update(aiDailyReport).set({
      latestNews: data.latestNews,
      toolRankings: data.toolRankings,
      videoAiTools: data.videoAiTools,
      generatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm.eq)(aiDailyReport.id, existing[0].id));
  } else {
    await db.insert(aiDailyReport).values(data);
  }
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
var import_zod4 = require("zod");

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
  const headerLine = allLines[0] || "";
  const headers = parseCSVLine(headerLine);
  const idxLikeRate = headers.findIndex((h) => h.includes("\u9AD8\u8A55\u4FA1\u7387"));
  const idxAvgViewRate = headers.findIndex((h) => h.includes("\u5E73\u5747\u8996\u8074\u7387"));
  const idxViews = headers.findIndex((h) => h.includes("\u8996\u8074\u56DE\u6570"));
  const idxSubscriber = headers.findIndex((h) => h.includes("\u30C1\u30E3\u30F3\u30CD\u30EB\u767B\u9332\u8005"));
  const idxRevenue = headers.findIndex((h) => h.includes("\u63A8\u5B9A\u53CE\u76CA"));
  const idxImpressions = headers.findIndex((h) => h.includes("\u30A4\u30F3\u30D7\u30EC\u30C3\u30B7\u30E7\u30F3\u6570"));
  const idxCtr = headers.findIndex((h) => h.includes("\u30AF\u30EA\u30C3\u30AF\u7387"));
  const colLikeRate = idxLikeRate >= 0 ? idxLikeRate : 4;
  const colAvgViewRate = idxAvgViewRate >= 0 ? idxAvgViewRate : 5;
  const colViews = idxViews >= 0 ? idxViews : 6;
  const colSubscriber = idxSubscriber >= 0 ? idxSubscriber : 7;
  const colRevenue = idxRevenue >= 0 ? idxRevenue : 8;
  const colImpressions = idxImpressions >= 0 ? idxImpressions : 9;
  const colCtr = idxCtr >= 0 ? idxCtr : 10;
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
    const likeRate = parseFloat(cols[colLikeRate]) || 0;
    const avgViewRate = parseFloat(cols[colAvgViewRate]) || 0;
    const views = parseInt(cols[colViews]) || 0;
    const subscriberChange = parseInt(cols[colSubscriber]) || 0;
    const estimatedRevenue = parseFloat(cols[colRevenue]) || 0;
    const impressions = parseInt(cols[colImpressions]) || 0;
    const ctr = parseFloat(cols[colCtr]) || 0;
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
  }),
  // ── 初速データ（Early Stats）API ────────────────────────────────────────────
  // 初速データを保存・更新
  saveEarlyStats: publicProcedure.input(import_zod2.z.object({
    videoId: import_zod2.z.string(),
    timeWindow: import_zod2.z.enum(["1h", "24h", "48h", "1week"]),
    views: import_zod2.z.number().min(0),
    impressions: import_zod2.z.number().min(0),
    ctr: import_zod2.z.number().min(0),
    avgViewRate: import_zod2.z.number().min(0),
    avgWatchTimeSec: import_zod2.z.number().min(0).optional().default(0),
    likeRate: import_zod2.z.number().min(0)
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(videoEarlyStats).values({
      videoId: input.videoId,
      timeWindow: input.timeWindow,
      views: input.views,
      impressions: input.impressions,
      ctr: input.ctr,
      avgViewRate: input.avgViewRate,
      avgWatchTimeSec: input.avgWatchTimeSec ?? 0,
      likeRate: input.likeRate
    }).onDuplicateKeyUpdate({
      set: {
        views: input.views,
        impressions: input.impressions,
        ctr: input.ctr,
        avgViewRate: input.avgViewRate,
        avgWatchTimeSec: input.avgWatchTimeSec ?? 0,
        likeRate: input.likeRate
      }
    });
    return { success: true };
  }),
  // 特定動画の初速データを取得
  getEarlyStats: publicProcedure.input(import_zod2.z.object({ videoId: import_zod2.z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(videoEarlyStats).where((0, import_drizzle_orm2.eq)(videoEarlyStats.videoId, input.videoId)).orderBy((0, import_drizzle_orm2.asc)(videoEarlyStats.timeWindow));
    return rows;
  }),
  // 全動画の初速データ一覧（ランキング用）
  getAllEarlyStats: publicProcedure.input(import_zod2.z.object({
    timeWindow: import_zod2.z.enum(["1h", "24h", "48h", "1week"]).optional(),
    sortBy: import_zod2.z.enum(["views", "impressions", "ctr", "avgViewRate", "avgWatchTimeSec", "likeRate"]).optional(),
    limit: import_zod2.z.number().min(1).max(200).optional()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const tw = input.timeWindow ?? "24h";
    const limit = input.limit ?? 50;
    const rows = await db.select({
      id: videoEarlyStats.id,
      videoId: videoEarlyStats.videoId,
      timeWindow: videoEarlyStats.timeWindow,
      views: videoEarlyStats.views,
      impressions: videoEarlyStats.impressions,
      ctr: videoEarlyStats.ctr,
      avgViewRate: videoEarlyStats.avgViewRate,
      avgWatchTimeSec: videoEarlyStats.avgWatchTimeSec,
      likeRate: videoEarlyStats.likeRate,
      recordedAt: videoEarlyStats.recordedAt,
      title: videos.title,
      publishedAt: videos.publishedAt,
      isShort: videos.isShort,
      finalViews: videos.views,
      duration: videos.duration
    }).from(videoEarlyStats).leftJoin(videos, (0, import_drizzle_orm2.eq)(videoEarlyStats.videoId, videos.videoId)).where((0, import_drizzle_orm2.eq)(videoEarlyStats.timeWindow, tw)).orderBy((0, import_drizzle_orm2.desc)(videoEarlyStats.views)).limit(limit);
    return rows;
  }),
  // 初速データを削除
  deleteEarlyStats: publicProcedure.input(import_zod2.z.object({ id: import_zod2.z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(videoEarlyStats).where((0, import_drizzle_orm2.eq)(videoEarlyStats.id, input.id));
    return { success: true };
  }),
  // DBのavgViewRateとlikeRateを入れ替える修正エンドポイント
  fixSwappedRates: publicProcedure.input(import_zod2.z.object({ secret: import_zod2.z.string() })).mutation(async ({ input }) => {
    if (input.secret !== "fix-swap-2026") throw new Error("Unauthorized");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allVideos = await db.select().from(videos);
    let updated = 0;
    for (const v of allVideos) {
      await db.update(videos).set({ avgViewRate: v.likeRate, likeRate: v.avgViewRate }).where((0, import_drizzle_orm2.eq)(videos.id, v.id));
      updated++;
    }
    return { success: true, updated };
  })
});

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

// server/ai-info-router.ts
var import_zod3 = require("zod");
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/g, (e) => {
    const map = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#039;": "'",
      "&nbsp;": " ",
      "&mdash;": "\u2014",
      "&ndash;": "\u2013",
      "&hellip;": "\u2026"
    };
    return map[e] ?? e;
  }).trim();
}
async function fetchAiGalleryNews() {
  const categoryIds = [495, 400, 319, 1, 318];
  const allPosts = [];
  for (const catId of categoryIds) {
    try {
      const res = await fetch(
        `https://ai-gallery.jp/wp-json/wp/v2/posts?per_page=5&categories=${catId}&_fields=id,title,link,date,excerpt&orderby=date&order=desc`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible; ViewCore/1.0)" } }
      );
      if (!res.ok) continue;
      const posts = await res.json();
      const catName = catId === 495 ? "AI\u30CB\u30E5\u30FC\u30B9" : catId === 400 ? "AI\u30C4\u30FC\u30EB" : catId === 319 ? "AI\u6D3B\u7528\u4E8B\u4F8B" : catId === 1 ? "ChatGPT" : "AI\u57FA\u790E\u77E5\u8B58";
      const impact = catId === 495 ? "high" : catId === 400 || catId === 319 ? "medium" : "low";
      for (const post of posts) {
        const title = stripHtml(post.title.rendered);
        const summary = stripHtml(post.excerpt.rendered).slice(0, 120);
        allPosts.push({
          title,
          summary: summary || title,
          category: catName,
          impact,
          url: post.link,
          publishedAt: post.date.slice(0, 10)
        });
      }
    } catch {
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return allPosts.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 15);
}
async function fetchAaMediaRankings(mediaType) {
  const pageUrl = mediaType === "image" ? "https://artificialanalysis.ai/text-to-image" : "https://artificialanalysis.ai/video";
  let html = "";
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    if (res.ok) html = await res.text();
  } catch {
    return [];
  }
  if (!html || html.length < 1e4) return [];
  const urlPrefix = mediaType === "image" ? "/image/model-families/" : "/video/model-families/";
  const baseUrl = "https://artificialanalysis.ai";
  const entryPattern = /\\"name\\":\\"([^\\]+)\\"[^}]{0,300}\\"url\\":\\"(\/(?:image|video)\/model-families\/[^\\]+)\\"[^}]{0,500}\\"elos\\":\[\{\\"elo\\":([\.\d]+)/g;
  const seen = /* @__PURE__ */ new Map();
  let m;
  while ((m = entryPattern.exec(html)) !== null) {
    const name = m[1];
    const urlPath = m[2];
    const elo = parseFloat(m[3]);
    if (!seen.has(name) || seen.get(name).elo < elo) {
      seen.set(name, { elo, url: urlPath });
    }
  }
  if (seen.size === 0) return [];
  const sorted = Array.from(seen.entries()).sort((a, b) => b[1].elo - a[1].elo).slice(0, 8);
  const imageDescriptions = {
    "Midjourney": { desc: "\u9AD8\u54C1\u8CEA\u30A2\u30FC\u30C8\u751F\u6210\u306E\u5B9A\u756A\u30C4\u30FC\u30EB", bestFor: "\u82B8\u8853\u7684\u30FB\u9AD8\u54C1\u8CEA\u306A\u753B\u50CF\u751F\u6210" },
    "OpenAI GPT": { desc: "OpenAI\u306EGPT-4o\u753B\u50CF\u751F\u6210", bestFor: "\u30C6\u30AD\u30B9\u30C8\u4ED8\u304D\u753B\u50CF\u30FB\u6C4E\u7528\u751F\u6210" },
    "Gemini": { desc: "Google\u306EImagen\u642D\u8F09\u30E2\u30C7\u30EB", bestFor: "\u30EA\u30A2\u30EB\u306A\u5199\u771F\u30FB\u591A\u69D8\u306A\u30B9\u30BF\u30A4\u30EB" },
    "Riverflow": { desc: "\u9AD8\u901F\u30FB\u9AD8\u54C1\u8CEA\u306A\u753B\u50CF\u751F\u6210", bestFor: "\u5546\u7528\u5229\u7528\u30FB\u9AD8\u901F\u751F\u6210" },
    "FLUX": { desc: "Black Forest\u306E\u9AD8\u54C1\u8CEA\u30AA\u30FC\u30D7\u30F3\u30E2\u30C7\u30EB", bestFor: "\u30EA\u30A2\u30EB\u5199\u771F\u30FB\u30D5\u30A1\u30A4\u30F3\u30C1\u30E5\u30FC\u30CB\u30F3\u30B0" },
    "Ideogram": { desc: "\u30C6\u30AD\u30B9\u30C8\u63CF\u753B\u304C\u5F97\u610F\u306A\u753B\u50CF\u751F\u6210AI", bestFor: "\u30ED\u30B4\u30FB\u30C6\u30AD\u30B9\u30C8\u5165\u308A\u753B\u50CF" },
    "Recraft": { desc: "\u30C7\u30B6\u30A4\u30F3\u7279\u5316\u306E\u753B\u50CF\u751F\u6210AI", bestFor: "UI/UX\u30FB\u30D9\u30AF\u30BF\u30FC\u30C7\u30B6\u30A4\u30F3" },
    "Seedream": { desc: "\u30D0\u30A4\u30C8\u30C0\u30F3\u30B9\u767A\u306E\u9AD8\u54C1\u8CEA\u30E2\u30C7\u30EB", bestFor: "\u30A2\u30CB\u30E1\u30FB\u30A4\u30E9\u30B9\u30C8\u751F\u6210" },
    "Adobe Firefly": { desc: "Adobe\u306E\u5546\u7528\u5B89\u5168\u306A\u753B\u50CF\u751F\u6210AI", bestFor: "\u5546\u7528\u5229\u7528\u30FB\u8457\u4F5C\u6A29\u30D5\u30EA\u30FC" },
    "Imagen": { desc: "Google DeepMind\u306E\u753B\u50CF\u751F\u6210\u30E2\u30C7\u30EB", bestFor: "\u30EA\u30A2\u30EB\u306A\u5199\u771F\u751F\u6210" }
  };
  const videoDescriptions = {
    "Kling": { desc: "Kuaishou\u306E\u9AD8\u54C1\u8CEA\u52D5\u753B\u751F\u6210AI", bestFor: "\u30EA\u30A2\u30EB\u306A\u52D5\u753B\u30FB\u9577\u5C3A\u751F\u6210" },
    "Sora": { desc: "OpenAI\u306E\u9769\u65B0\u7684\u52D5\u753B\u751F\u6210AI", bestFor: "\u9AD8\u54C1\u8CEA\u30FB\u9577\u5C3A\u52D5\u753B\u751F\u6210" },
    "Runway": { desc: "\u30D7\u30ED\u5411\u3051\u52D5\u753B\u751F\u6210\u30FB\u7DE8\u96C6AI", bestFor: "\u6620\u50CF\u5236\u4F5C\u30FB\u30A8\u30D5\u30A7\u30AF\u30C8" },
    "Pika": { desc: "\u9AD8\u901F\u52D5\u753B\u751F\u6210\u306E\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7", bestFor: "\u77ED\u5C3A\u30FB\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6\u52D5\u753B" },
    "Veo": { desc: "Google\u306EDeepMind\u52D5\u753B\u751F\u6210AI", bestFor: "\u9AD8\u54C1\u8CEA\u30FB\u6620\u753B\u7684\u52D5\u753B" },
    "Wan": { desc: "Alibaba\u306E\u52D5\u753B\u751F\u6210\u30E2\u30C7\u30EB", bestFor: "\u4E2D\u56FD\u8A9E\u30B3\u30F3\u30C6\u30F3\u30C4\u30FB\u6C4E\u7528" },
    "HunyuanVideo": { desc: "Tencent\u306E\u9AD8\u54C1\u8CEA\u52D5\u753B\u751F\u6210AI", bestFor: "\u30EA\u30A2\u30EB\u52D5\u753B\u30FB\u9577\u5C3A\u751F\u6210" },
    "LTX": { desc: "Lightricks\u88FD\u306E\u9AD8\u901F\u52D5\u753B\u751F\u6210", bestFor: "\u9AD8\u901F\u30FB\u4F4E\u30B3\u30B9\u30C8\u52D5\u753B\u751F\u6210" },
    "CogVideoX": { desc: "\u6E05\u83EF\u5927\u5B66\u767A\u306E\u30AA\u30FC\u30D7\u30F3\u52D5\u753BAI", bestFor: "\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u30FB\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA" }
  };
  const descMap = mediaType === "image" ? imageDescriptions : videoDescriptions;
  function getMediaInfo(name) {
    for (const [key, info] of Object.entries(descMap)) {
      if (name.includes(key)) return info;
    }
    return { desc: `${mediaType === "image" ? "\u753B\u50CF" : "\u52D5\u753B"}\u751F\u6210AI\u30E2\u30C7\u30EB`, bestFor: "\u9AD8\u54C1\u8CEA\u30B3\u30F3\u30C6\u30F3\u30C4\u751F\u6210" };
  }
  return sorted.map(([name, { elo, url }], i) => {
    const info = getMediaInfo(name);
    return {
      rank: i + 1,
      toolName: name,
      description: info.desc,
      bestFor: info.bestFor,
      url: `${baseUrl}${url}`,
      score: `ELO: ${elo.toFixed(0)}`
    };
  });
}
async function fetchAaAllModels() {
  let html = "";
  try {
    const res = await fetch("https://artificialanalysis.ai/", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    if (res.ok) html = await res.text();
  } catch {
    return [];
  }
  if (!html || html.length < 1e5) return [];
  const scriptMatches = [...html.matchAll(/<script[^>]*>(self\.__next_f\.push\(.*?\))<\/script>/gs)];
  let targetScript = "";
  for (const match of scriptMatches) {
    if (match[1].includes("safeGdpval") && match[1].length > 5e4) {
      targetScript = match[1];
      break;
    }
  }
  if (!targetScript) return [];
  const idPositions = [];
  const idPattern = /\{\\"id\\":\\"[0-9a-f-]{36}\\"/g;
  let m;
  while ((m = idPattern.exec(targetScript)) !== null) {
    idPositions.push(m.index);
  }
  if (idPositions.length === 0) return [];
  const models = [];
  const baseUrl = "https://artificialanalysis.ai";
  for (let i = 0; i < idPositions.length; i++) {
    const start = idPositions[i];
    const end = i + 1 < idPositions.length ? idPositions[i + 1] : start + 5e3;
    const entry = targetScript.substring(start, end);
    const nameMatch = /\\"short_name\\":\\"([^\\"]+)\\"/.exec(entry);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const urlMatch = /\\"model_url\\":\\"([^\\"]+)\\"/.exec(entry);
    const modelUrl = urlMatch ? urlMatch[1] : null;
    const extract = (pattern) => {
      const m2 = pattern.exec(entry);
      return m2 ? parseFloat(m2[1]) : void 0;
    };
    const intelligence = extract(/\\"intelligence_index\\":([-\d.]+)/);
    const speed = extract(/\\"median_output_speed\\":([-\d.]+)/);
    const price = extract(/\\"price_1m_blended_3_to_1\\":([-\d.]+)/);
    const omniscience = extract(/\\"omniscience\\":([-\d.]+)/);
    const gdpval = extract(/\\"safeGdpval\\":\{\\"elo\\":([-\d.]+)/);
    const openness = extract(/\\"opennessIndex\\":([-\d.]+)/);
    const coding = extract(/\\"coding_index\\":([-\d.]+)/);
    const agentic = extract(/\\"agentic_index\\":([-\d.]+)/);
    models.push({
      name,
      url: modelUrl ? `${baseUrl}${modelUrl}` : baseUrl,
      intelligence,
      speed,
      price,
      omniscience,
      gdpval,
      openness,
      coding,
      agentic
    });
  }
  return models;
}
async function fetchArtificialAnalysisRankings() {
  const modelDescriptions = {
    "Gemini": { desc: "Google\u306E\u6700\u65B0\u30DE\u30EB\u30C1\u30E2\u30FC\u30C0\u30EBLLM", bestFor: "\u8907\u96D1\u306A\u63A8\u8AD6\u30FB\u30B3\u30FC\u30C9\u751F\u6210" },
    "GPT": { desc: "OpenAI\u306E\u6700\u65B0GPT\u30E2\u30C7\u30EB", bestFor: "\u6C4E\u7528\u30BF\u30B9\u30AF\u30FB\u6587\u7AE0\u751F\u6210" },
    "Claude": { desc: "Anthropic\u306E\u5B89\u5168\u6027\u91CD\u8996LLM", bestFor: "\u9577\u6587\u5206\u6790\u30FB\u30B3\u30F3\u30C6\u30F3\u30C4\u751F\u6210" },
    "Grok": { desc: "xAI\u306E\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u60C5\u5831\u5BFE\u5FDCLLM", bestFor: "\u6700\u65B0\u60C5\u5831\u30FBX\u9023\u643A\u30BF\u30B9\u30AF" },
    "DeepSeek": { desc: "\u4E2D\u56FD\u767A\u306E\u9AD8\u30B3\u30B9\u30D1\u30AA\u30FC\u30D7\u30F3LLM", bestFor: "\u30B3\u30FC\u30C9\u751F\u6210\u30FB\u6570\u5B66\u63A8\u8AD6" },
    "Llama": { desc: "Meta\u306E\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u30E2\u30C7\u30EB", bestFor: "\u30ED\u30FC\u30AB\u30EB\u5B9F\u884C\u30FB\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA" },
    "Mistral": { desc: "\u6B27\u5DDE\u767A\u306E\u8EFD\u91CF\u9AD8\u6027\u80FDLLM", bestFor: "\u9AD8\u901F\u51E6\u7406\u30FB\u30B3\u30B9\u30C8\u524A\u6E1B" },
    "NVIDIA": { desc: "NVIDIA\u88FD\u306E\u9AD8\u901F\u63A8\u8AD6LLM", bestFor: "\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u5411\u3051" },
    "GLM": { desc: "\u6E05\u83EF\u5927\u5B66\u767A\u306E\u4E2D\u56FD\u8A9E\u5BFE\u5FDCLLM", bestFor: "\u4E2D\u56FD\u8A9E\u51E6\u7406\u30FB\u591A\u8A00\u8A9E\u5BFE\u5FDC" },
    "Muse": { desc: "\u65B0\u4E16\u4EE3\u30AF\u30EA\u30A8\u30A4\u30C6\u30A3\u30D6LLM", bestFor: "\u5275\u4F5C\u30FB\u30A2\u30A4\u30C7\u30A2\u751F\u6210" },
    "gpt-oss": { desc: "OpenAI\u306E\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u7CFB\u30E2\u30C7\u30EB", bestFor: "\u9AD8\u901F\u51E6\u7406\u30FB\u4F4E\u30B3\u30B9\u30C8" },
    "MiniMax": { desc: "MiniMax\u306E\u9AD8\u6027\u80FD\u30DE\u30EB\u30C1\u30E2\u30FC\u30C0\u30EBLLM", bestFor: "\u30DE\u30EB\u30C1\u30E2\u30FC\u30C0\u30EB\u30FB\u9577\u6587\u51E6\u7406" },
    "Qwen": { desc: "Alibaba\u306E\u591A\u8A00\u8A9E\u5BFE\u5FDCLLM", bestFor: "\u591A\u8A00\u8A9E\u51E6\u7406\u30FB\u30B3\u30FC\u30C9\u751F\u6210" },
    "Kimi": { desc: "Moonshot AI\u306E\u9577\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8LLM", bestFor: "\u8D85\u9577\u6587\u51E6\u7406\u30FB\u6587\u66F8\u5206\u6790" },
    "K2": { desc: "MBZUAI\u767A\u306E\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9LLM", bestFor: "\u7814\u7A76\u30FB\u30AA\u30FC\u30D7\u30F3\u5229\u7528" },
    "Nemotron": { desc: "NVIDIA\u88FD\u306E\u9AD8\u6027\u80FD\u63A8\u8AD6LLM", bestFor: "\u30A8\u30F3\u30BF\u30FC\u30D7\u30E9\u30A4\u30BA\u30FB\u9AD8\u901F\u51E6\u7406" },
    "MiMo": { desc: "Xiaomi\u767A\u306E\u8EFD\u91CF\u9AD8\u6027\u80FDLLM", bestFor: "\u30E2\u30D0\u30A4\u30EB\u30FB\u30A8\u30C3\u30B8\u63A8\u8AD6" },
    "Gemma": { desc: "Google\u306E\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u8EFD\u91CFLLM", bestFor: "\u30ED\u30FC\u30AB\u30EB\u5B9F\u884C\u30FB\u7814\u7A76" },
    "Solar": { desc: "Upstage\u767A\u306E\u9AD8\u6027\u80FDLLM", bestFor: "\u4F01\u696D\u5411\u3051\u30FB\u6587\u66F8\u51E6\u7406" },
    "EXAONE": { desc: "LG AI Research\u767A\u306ELLM", bestFor: "\u97D3\u56FD\u8A9E\u30FB\u591A\u8A00\u8A9E\u51E6\u7406" }
  };
  function getModelInfo(name) {
    for (const [key, info] of Object.entries(modelDescriptions)) {
      if (name.includes(key)) return info;
    }
    return { desc: "\u9AD8\u6027\u80FDAI\u30E2\u30C7\u30EB", bestFor: "\u6C4E\u7528\u30BF\u30B9\u30AF" };
  }
  const toToolList = (models, scoreField, scoreLabel, scoreUnit, ascending = false, decimalPlaces = 1) => models.map((m, i) => {
    const info = getModelInfo(m.name);
    const scoreVal = m[scoreField];
    const scoreStr = scoreVal !== void 0 ? `${scoreLabel}: ${scoreVal.toFixed(decimalPlaces)}${scoreUnit}` : void 0;
    return {
      rank: i + 1,
      toolName: m.name,
      description: info.desc,
      bestFor: info.bestFor,
      url: m.url,
      score: scoreStr
    };
  });
  const rankings = [];
  const [allModels, imageModels, videoModels] = await Promise.all([
    fetchAaAllModels(),
    fetchAaMediaRankings("image"),
    fetchAaMediaRankings("video")
  ]);
  if (allModels.length > 0) {
    const intelligenceModels = allModels.filter((m) => m.intelligence !== void 0 && m.intelligence !== null).sort((a, b) => (b.intelligence ?? 0) - (a.intelligence ?? 0)).slice(0, 8);
    if (intelligenceModels.length > 0) {
      rankings.push({
        category: "\u{1F9E0} \u77E5\u80FD\u6307\u6570\uFF08Intelligence Index\uFF09",
        tools: toToolList(intelligenceModels, "intelligence", "\u77E5\u6027\u6307\u6570", "")
      });
    }
    const omniscienceModels = allModels.filter((m) => m.omniscience !== void 0 && m.omniscience !== null).sort((a, b) => (b.omniscience ?? -999) - (a.omniscience ?? -999)).slice(0, 8);
    if (omniscienceModels.length > 0) {
      rankings.push({
        category: "\u{1F310} AA-\u5168\u77E5\uFF08Omniscience Index\uFF09",
        tools: toToolList(omniscienceModels, "omniscience", "\u5168\u77E5\u6307\u6570", "")
      });
    }
    const gdpvalModels = allModels.filter((m) => m.gdpval !== void 0 && m.gdpval !== null).sort((a, b) => (b.gdpval ?? 0) - (a.gdpval ?? 0)).slice(0, 8);
    if (gdpvalModels.length > 0) {
      rankings.push({
        category: "\u{1F3C6} GDPval-AA\uFF08\u7D4C\u6E08\u4FA1\u5024\u30B9\u30B3\u30A2\uFF09",
        tools: toToolList(gdpvalModels, "gdpval", "ELO", "", false, 0)
      });
    }
    const opennessModels = allModels.filter((m) => m.openness !== void 0 && m.openness !== null).sort((a, b) => (b.openness ?? 0) - (a.openness ?? 0)).slice(0, 8);
    if (opennessModels.length > 0) {
      rankings.push({
        category: "\u{1F513} \u958B\u653E\u6027\u6307\u6570\uFF08Openness Index\uFF09",
        tools: toToolList(opennessModels, "openness", "\u958B\u653E\u6027", "")
      });
    }
    const codingModels = allModels.filter((m) => m.coding !== void 0 && m.coding !== null).sort((a, b) => (b.coding ?? 0) - (a.coding ?? 0)).slice(0, 8);
    if (codingModels.length > 0) {
      rankings.push({
        category: "\u{1F4BB} \u60C5\u5831\u5206\u6790\u30FB\u30B3\u30FC\u30C7\u30A3\u30F3\u30B0\u6307\u6570\uFF08Coding Index\uFF09",
        tools: toToolList(codingModels, "coding", "\u30B3\u30FC\u30C7\u30A3\u30F3\u30B0\u6307\u6570", "")
      });
    }
    const agenticModels = allModels.filter((m) => m.agentic !== void 0 && m.agentic !== null).sort((a, b) => (b.agentic ?? 0) - (a.agentic ?? 0)).slice(0, 8);
    if (agenticModels.length > 0) {
      rankings.push({
        category: "\u{1F916} \u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u6307\u6570\uFF08Agentic Index\uFF09",
        tools: toToolList(agenticModels, "agentic", "\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u6307\u6570", "")
      });
    }
    const speedModels = allModels.filter((m) => m.speed !== void 0 && m.speed !== null && (m.speed ?? 0) > 0).sort((a, b) => (b.speed ?? 0) - (a.speed ?? 0)).slice(0, 8);
    if (speedModels.length > 0) {
      rankings.push({
        category: "\u26A1 \u901F\u5EA6\u3068\u9045\u5EF6\uFF08Output Speed\uFF09",
        tools: toToolList(speedModels, "speed", "\u901F\u5EA6", " tok/s", false, 0)
      });
    }
    const priceModels = allModels.filter((m) => m.price !== void 0 && m.price !== null && (m.price ?? 0) > 0).sort((a, b) => (a.price ?? 999) - (b.price ?? 999)).slice(0, 8);
    if (priceModels.length > 0) {
      rankings.push({
        category: "\u{1F4B0} \u4FA1\u683C\u30FB\u30B3\u30B9\u30C8\u52B9\u7387\uFF08Price per 1M tokens\uFF09",
        tools: toToolList(priceModels, "price", "\u4FA1\u683C", "$/M", true, 4)
      });
    }
  }
  if (imageModels.length > 0) {
    rankings.push({
      category: "\u{1F5BC}\uFE0F \u753B\u50CF\u751F\u6210\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08ELO\u30B9\u30B3\u30A2\uFF09",
      tools: imageModels
    });
  }
  if (videoModels.length > 0) {
    rankings.push({
      category: "\u{1F3AC} \u52D5\u753B\u751F\u6210\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08ELO\u30B9\u30B3\u30A2\uFF09",
      tools: videoModels
    });
  }
  if (rankings.length < 2) {
    return generateFallbackRankings();
  }
  return rankings;
}
async function generateFallbackRankings() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `\u3042\u306A\u305F\u306FAI\u696D\u754C\u306E\u30A2\u30CA\u30EA\u30B9\u30C8\u3067\u3059\u3002${today}\u6642\u70B9\u306E\u6700\u65B0AI\u30E2\u30C7\u30EB\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u65E5\u672C\u8A9E\u3067\u307E\u3068\u3081\u3066\u304F\u3060\u3055\u3044\u3002
\u5FC5\u305A\u4EE5\u4E0B\u306EJSON\u914D\u5217\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u4ED6\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u4E0D\u8981\uFF09:
[{
  "category": "\u30AB\u30C6\u30B4\u30EA\u540D\uFF08\u65E5\u672C\u8A9E\uFF09",
  "tools": [
    {
      "rank": 1,
      "toolName": "\u30C4\u30FC\u30EB\u540D",
      "description": "\u7279\u5FB4\u30FB\u5F97\u610F\u306A\u3053\u3068\uFF0860\u6587\u5B57\u4EE5\u5185\uFF09",
      "bestFor": "\u6700\u9069\u306A\u7528\u9014\uFF0830\u6587\u5B57\u4EE5\u5185\uFF09",
      "url": "\u516C\u5F0F\u30B5\u30A4\u30C8URL",
      "score": "\u30B9\u30B3\u30A2\u3084\u8A55\u4FA1"
    }
  ]
}]
\u4EE5\u4E0B\u306E\u30AB\u30C6\u30B4\u30EA\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044:
1. LLM\u77E5\u6027\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u4E0A\u4F4D5\u30E2\u30C7\u30EB\uFF09
2. LLM\u30B9\u30D4\u30FC\u30C9\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u4E0A\u4F4D5\u30E2\u30C7\u30EB\uFF09
3. LLM\u30B3\u30B9\u30D1\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u4E0A\u4F4D5\u30E2\u30C7\u30EB\uFF09
4. \u753B\u50CF\u751F\u6210\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u4E0A\u4F4D5\u30E2\u30C7\u30EB\uFF09
5. \u52D5\u753B\u751F\u6210\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u4E0A\u4F4D5\u30E2\u30C7\u30EB\uFF09`
      },
      {
        role: "user",
        content: `${today}\u6642\u70B9\u306E\u6700\u65B0AI\u30E2\u30C7\u30EB\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002Artificial Analysis (artificialanalysis.ai) \u306E\u30C7\u30FC\u30BF\u3092\u53C2\u8003\u306B\u3001\u5404\u30AB\u30C6\u30B4\u30EA\u4E0A\u4F4D5\u30E2\u30C7\u30EB\u3092\u307E\u3068\u3081\u3066\u304F\u3060\u3055\u3044\u3002`
      }
    ],
    response_format: { type: "json_object" }
  });
  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsed) ? parsed : parsed.rankings ?? parsed.categories ?? [];
  } catch {
    return [];
  }
}
async function fetchLedgeAiNews() {
  let html = "";
  try {
    const res = await fetch("https://ledge.ai/", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    if (res.ok) html = await res.text();
  } catch {
    return [];
  }
  if (!html || html.length < 5e4) return [];
  const thumbnailSuffix = "\u306E\u30B5\u30E0\u30CD\u30A4\u30EB\u753B\u50CF";
  const patternStr = String.raw`(\d{4})<span>/<\/span>(\d{1,2})<span>/<\/span>(\d{1,2})[\s\S]{0,500}?href="(\/articles\/([^"]+))"[\s\S]{0,500}?alt="([^"]+?)(?:${thumbnailSuffix})?"`;
  const pattern = new RegExp(patternStr, "g");
  const articles = [];
  const seen = /* @__PURE__ */ new Set();
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const [, year, month, day, urlPath, slug, title] = m;
    if (seen.has(slug)) continue;
    seen.add(slug);
    articles.push({
      title,
      url: "https://ledge.ai" + urlPath,
      publishedAt: year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0")
    });
    if (articles.length >= 20) break;
  }
  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
async function generateVideoAiTools(today) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `\u3042\u306A\u305F\u306FYouTube\u52D5\u753B\u5236\u4F5C\u306B\u7279\u5316\u3057\u305FAI\u30C4\u30FC\u30EB\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u5FC5\u305A\u4EE5\u4E0B\u306EJSON\u914D\u5217\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u4ED6\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u4E0D\u8981\uFF09: [{"toolName":"\u30C4\u30FC\u30EB\u540D","category":"\u30AB\u30C6\u30B4\u30EA\uFF08\u52D5\u753B\u751F\u6210/\u52D5\u753B\u7DE8\u96C6/\u30B5\u30E0\u30CD\u30A4\u30EB/BGM/\u5B57\u5E55/\u30A8\u30D5\u30A7\u30AF\u30C8\uFF09","description":"\u30C4\u30FC\u30EB\u306E\u6982\u8981\uFF0850\u6587\u5B57\u4EE5\u5185\uFF09","useCases":["\u6D3B\u7528\u4E8B\u4F8B1","\u6D3B\u7528\u4E8B\u4F8B2","\u6D3B\u7528\u4E8B\u4F8B3"],"tips":"YouTuber\u3078\u306E\u30A2\u30C9\u30D0\u30A4\u30B9\uFF08100\u6587\u5B57\u4EE5\u5185\uFF09","url":"\u516C\u5F0F\u30B5\u30A4\u30C8URL","pricing":"\u7121\u6599/\u6709\u6599/\u30D5\u30EA\u30FC\u30DF\u30A2\u30E0"}]`
      },
      {
        role: "user",
        content: `${today}\u6642\u70B9\u3067\u306EYouTube\u52D5\u753B\u5236\u4F5C\u306B\u4F7F\u3048\u308BAI\u30C4\u30FC\u30EB\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044\u3002Kling AI\u3001DomoAI\u3001Veo3\u3001Runway\u3001Pika\u3001Sora\u3001ElevenLabs\u3001Midjourney\u3001CapCut AI\u3001Topaz Video AI\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002\u5404\u30C4\u30FC\u30EB\u306E\u6D3B\u7528\u4E8B\u4F8B\u3068YouTuber\u3078\u306E\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002`
      }
    ],
    response_format: { type: "json_object" }
  });
  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsed) ? parsed : parsed.tools ?? parsed.videoTools ?? [];
  } catch {
    return [];
  }
}
var aiInfoRouter = router({
  /**
   * Get the latest AI daily report from DB.
   */
  getLatestReport: publicProcedure.query(async () => {
    const report = await getLatestAiDailyReport();
    if (!report) return null;
    return {
      reportDate: report.reportDate,
      generatedAt: report.generatedAt,
      latestNews: report.latestNews ? JSON.parse(report.latestNews) : [],
      toolRankings: report.toolRankings ? JSON.parse(report.toolRankings) : [],
      videoAiTools: report.videoAiTools ? JSON.parse(report.videoAiTools) : [],
      ledgeNews: report.ledgeNews ? JSON.parse(report.ledgeNews) : []
    };
  }),
  /** Get all info sources */
  getInfoSources: publicProcedure.query(async () => {
    await seedDefaultInfoSources();
    return getInfoSources();
  }),
  /** Add a new info source */
  addInfoSource: publicProcedure.input(import_zod3.z.object({
    category: import_zod3.z.enum(["youtube", "x", "website"]),
    title: import_zod3.z.string().min(1).max(255),
    url: import_zod3.z.string().url(),
    memo: import_zod3.z.string().optional()
  })).mutation(async ({ input }) => {
    return addInfoSource(input);
  }),
  /** Update memo for an info source */
  updateInfoSourceMemo: publicProcedure.input(import_zod3.z.object({
    id: import_zod3.z.number(),
    memo: import_zod3.z.string()
  })).mutation(async ({ input }) => {
    return updateInfoSourceMemo(input.id, input.memo);
  }),
  /** Delete an info source */
  deleteInfoSource: publicProcedure.input(import_zod3.z.object({ id: import_zod3.z.number() })).mutation(async ({ input }) => {
    return deleteInfoSource(input.id);
  }),
  /**
   * Verify admin password for generating reports manually.
   */
  verifyAdminPassword: publicProcedure.input(import_zod3.z.object({ password: import_zod3.z.string() })).mutation(async ({ input }) => {
    const expectedPassword = process.env.ADMIN_GENERATE_PASSWORD;
    if (!expectedPassword) return { valid: false };
    return { valid: input.password === expectedPassword };
  }),
  /**
   * Generate a fresh AI daily report.
   * - News: real articles from ai-gallery.jp (WordPress REST API)
   * - Rankings: directly parsed from Artificial Analysis HTML
   * - Video tools: LLM-generated with latest knowledge
   */
  generateReport: publicProcedure.mutation(async () => {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const [latestNews, toolRankings, videoAiTools, ledgeNews] = await Promise.all([
      fetchAiGalleryNews(),
      fetchArtificialAnalysisRankings(),
      generateVideoAiTools(today),
      fetchLedgeAiNews()
    ]);
    await upsertAiDailyReport({
      reportDate: new Date(today),
      latestNews: JSON.stringify(latestNews),
      toolRankings: JSON.stringify(toolRankings),
      videoAiTools: JSON.stringify(videoAiTools),
      ledgeNews: JSON.stringify(ledgeNews),
      generatedAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      reportDate: today,
      newsCount: latestNews.length,
      rankingCategories: toolRankings.length,
      videoToolsCount: videoAiTools.length,
      ledgeNewsCount: ledgeNews.length
    };
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
    channelInfo: publicProcedure.input(import_zod4.z.object({ channelUrl: import_zod4.z.string() })).query(async ({ input }) => {
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
  analytics: analyticsRouter,
  aiInfo: aiInfoRouter
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

// api/handler.ts
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
var distDir = import_path.default.join(process.cwd(), "dist");
app.use(import_express.default.static(distDir));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const indexPath = import_path.default.join(distDir, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send("Not Found");
    }
  });
});
var handler_default = app;
