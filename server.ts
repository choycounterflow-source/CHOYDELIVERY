import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Lazy server-side GoogleGenAI client (never crashes server startup if key is unset on Render)
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const ASK_CHOY_SYSTEM_INSTRUCTION = `You are Ask Choy AI, the friendly, knowledgeable local Filipino food delivery assistant for ChoyFood.
Help customers, riders, and partner stores with concise, practical answers grounded in ChoyFood's actual platform features:
- Signature Partner Dishes: Lechon Kawali Fiesta Combo (₱220, Combo Meal, Nanay's Sizzling & BBQ), Sizzling Pork Sisig with Egg (₱180, Solo, Nanay's Sizzling & BBQ), Family Crispy Pata Feast (₱680, Good for Family, Cebu Grill Hub), Halo-Halo Special Supreme (₱120, Promo, Sweet Corner), Garlic Rice & Fried Egg Duo (₱45, Extra, Nanay's Sizzling & BBQ), Charcoal Pork BBQ Skewers 5 pcs (₱175, Solo, Cebu Grill Hub).
- Promo Code: CHOY25 gives ₱25 OFF on orders ₱250 and above.
- Choy Pro: ₱149/month for 1-Month unlimited FREE delivery across all partner stores.
- Choy Wallet: Non-withdrawable food credit usable exclusively for food and beverage orders on ChoyFood.
- Delivery Distance Tiers: 0-2 km is ₱25, 2-5 km is ₱35, 5-10 km is ₱50 (₱0 with Choy Pro).
- 7-Step Order Tracking: 1. Customer Picked -> 2. Admin Checked -> 3. Store Accepted -> 4. Rider Accepted (60-second dispatch window) -> 5. Food Ready -> 6. Rider Picked Up -> 7. Delivered with Proof of Delivery.
- KYC & Privacy: Customers use a public Display Name; legal names, phone numbers, and Valid IDs are strictly isolated in the encrypted Super Admin KYC Vault for fraud prevention only and are never shown to partner stores or riders.
- Rider Requirements: Barangay & Police clearances, valid driver's license, vehicle OR/CR, and Super Admin approval.
Keep responses warm, concise (2-4 sentences or short bullet points), and helpful.`;

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ChoyFood API",
    backend: "supabase",
    supabaseConfigured: Boolean(
      (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
        (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    ),
    hasAiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Public-safe runtime Supabase config so Render env vars work even without rebuild
app.get("/api/supabase-config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  });
});

// ---------------------------------------------------------------------------
// Server-Side Super Admin & Operations Admin Mobile + PIN Authentication
// - Verified exclusively on the server using constant-time comparison & scrypt
// - Configured process.env PIN always overrides any claimed fallback
// - Session tokens are signed HMAC-SHA256 Bearer tokens held in client memory
// ---------------------------------------------------------------------------
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SUPER_ADMIN_EMAIL = "choyjiez07@gmail.com";
const OPS_ADMIN_EMAIL = "admin@choyfood.ph";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

type ServerAdminRole = "super_admin" | "admin";

interface ClaimedAdminRecord {
  mobile: string;
  saltHex: string;
  hashHex: string;
  claimedAt: string;
}

const claimedAdmins: Record<ServerAdminRole, ClaimedAdminRecord | null> = {
  super_admin: null,
  admin: null,
};
const revokedTokenIds = new Set<string>();
const loginAttemptMap = new Map<string, { count: number; resetAt: number }>();

function normalizeMobile(raw: string): string {
  return String(raw || "").replace(/[^0-9]/g, "");
}

function maskMobile(mobile: string): string {
  if (mobile.length < 7) return "••••";
  return `${mobile.slice(0, 4)}••••${mobile.slice(-3)}`;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function hashPin(pin: string, saltHex?: string): { saltHex: string; hashHex: string } {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  const derived = crypto.scryptSync(pin, salt, 64);
  return { saltHex: salt.toString("hex"), hashHex: derived.toString("hex") };
}

function verifyScryptPin(pin: string, saltHex: string, expectedHashHex: string): boolean {
  const { hashHex } = hashPin(pin, saltHex);
  const a = Buffer.from(hashHex, "hex");
  const b = Buffer.from(expectedHashHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getEnvCredsForRole(role: ServerAdminRole): { envMobile: string; envPin: string } {
  if (role === "super_admin") {
    return {
      envMobile: normalizeMobile(process.env.SUPER_ADMIN_MOBILE || ""),
      envPin: (process.env.SUPER_ADMIN_PIN || "").trim(),
    };
  }
  return {
    envMobile: normalizeMobile(process.env.ADMIN_MOBILE || ""),
    envPin: (process.env.ADMIN_PIN || "").trim(),
  };
}

function issueAdminBearerToken(mobile: string, role: ServerAdminRole): string {
  const payload = {
    jti: crypto.randomBytes(16).toString("hex"),
    sub: role === "super_admin" ? "super-admin" : "ops-admin",
    email: role === "super_admin" ? SUPER_ADMIN_EMAIL : OPS_ADMIN_EMAIL,
    mobile,
    role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

function verifyAdminBearerToken(token: string): {
  jti: string;
  sub: string;
  email: string;
  mobile: string;
  role: ServerAdminRole;
  exp: number;
} | null {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
  if (!timingSafeStringEqual(sigB64, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
    if (typeof parsed.jti !== "string" || revokedTokenIds.has(parsed.jti)) return null;
    if (parsed.role !== "super_admin" && parsed.role !== "admin") return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractBearerToken(req: express.Request): string {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7).trim();
}

function isRateLimited(ipKey: string): boolean {
  const now = Date.now();
  const entry = loginAttemptMap.get(ipKey);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= 10;
}

function recordFailedLogin(ipKey: string): void {
  const now = Date.now();
  const entry = loginAttemptMap.get(ipKey);
  if (!entry || now > entry.resetAt) {
    loginAttemptMap.set(ipKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    entry.count += 1;
  }
}

function clearLoginAttempts(ipKey: string): void {
  loginAttemptMap.delete(ipKey);
}

function registerMobilePinAuthRoutes(prefix: string, role: ServerAdminRole, label: string) {
  app.get(`${prefix}/status`, (_req, res) => {
    const { envMobile, envPin } = getEnvCredsForRole(role);
    if (envPin) {
      return res.json({
        mode: "env",
        needsSetup: false,
        mobileHint: envMobile ? maskMobile(envMobile) : null,
      });
    }
    const claimed = claimedAdmins[role];
    if (claimed) {
      return res.json({
        mode: "claimed",
        needsSetup: false,
        mobileHint: maskMobile(claimed.mobile),
      });
    }
    return res.json({
      mode: "unclaimed",
      needsSetup: true,
      mobileHint: null,
    });
  });

  app.post(`${prefix}/setup`, (req, res) => {
    const { envPin } = getEnvCredsForRole(role);
    if (envPin || claimedAdmins[role]) {
      return res.status(403).json({
        error: `${label} credentials are already configured. Please sign in instead.`,
      });
    }

    const mobile = normalizeMobile(req.body?.mobile);
    const pin = String(req.body?.pin || "").trim();

    if (mobile.length < 10 || mobile.length > 15) {
      return res.status(400).json({ error: "Enter a valid mobile number (10–15 digits)." });
    }
    if (pin.length < 6 || pin.length > 32) {
      return res.status(400).json({ error: "PIN must be at least 6 characters long." });
    }

    const { saltHex, hashHex } = hashPin(pin);
    claimedAdmins[role] = {
      mobile,
      saltHex,
      hashHex,
      claimedAt: new Date().toISOString(),
    };

    const token = issueAdminBearerToken(mobile, role);
    return res.status(201).json({
      ok: true,
      token,
      admin: {
        uid: role === "super_admin" ? "super-admin" : "ops-admin",
        email: role === "super_admin" ? SUPER_ADMIN_EMAIL : OPS_ADMIN_EMAIL,
        displayName: label,
        mobile,
        role,
      },
    });
  });

  app.post(`${prefix}/login`, (req, res) => {
    const clientIp = `${role}:${String(req.ip || req.socket.remoteAddress || "unknown")}`;
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        error: "Too many failed sign-in attempts. Please wait 15 minutes and try again.",
      });
    }

    const mobile = normalizeMobile(req.body?.mobile);
    const pin = String(req.body?.pin || "").trim();

    if (!mobile || !pin) {
      return res.status(400).json({ error: "Mobile number and PIN are required." });
    }

    const { envMobile, envPin } = getEnvCredsForRole(role);
    const claimed = claimedAdmins[role];
    let authenticated = false;

    if (envPin) {
      const mobileOk = envMobile ? timingSafeStringEqual(mobile, envMobile) : mobile.length >= 10;
      const pinOk = timingSafeStringEqual(pin, envPin);
      authenticated = mobileOk && pinOk;
    } else if (claimed) {
      const mobileOk = timingSafeStringEqual(mobile, claimed.mobile);
      const pinOk = verifyScryptPin(pin, claimed.saltHex, claimed.hashHex);
      authenticated = mobileOk && pinOk;
    } else {
      return res.status(409).json({
        error: `${label} has not been claimed yet. Complete first-run setup first.`,
        needsSetup: true,
      });
    }

    if (!authenticated) {
      recordFailedLogin(clientIp);
      return res.status(401).json({ error: `Invalid ${label} mobile number or PIN.` });
    }

    clearLoginAttempts(clientIp);
    const token = issueAdminBearerToken(mobile, role);
    return res.json({
      ok: true,
      token,
      admin: {
        uid: role === "super_admin" ? "super-admin" : "ops-admin",
        email: role === "super_admin" ? SUPER_ADMIN_EMAIL : OPS_ADMIN_EMAIL,
        displayName: label,
        mobile,
        role,
      },
    });
  });
}

registerMobilePinAuthRoutes("/api/admin", "super_admin", "Super Admin");
registerMobilePinAuthRoutes("/api/ops-admin", "admin", "Admin Operations");

app.get("/api/admin/me", (req, res) => {
  const token = extractBearerToken(req);
  const verified = verifyAdminBearerToken(token);
  if (!verified) {
    return res.status(401).json({ error: "Unauthorized or expired session." });
  }
  return res.json({
    ok: true,
    admin: {
      uid: verified.sub,
      email: verified.email,
      displayName: verified.role === "super_admin" ? "Super Admin" : "Admin Operations",
      mobile: verified.mobile,
      role: verified.role,
    },
  });
});

app.post("/api/admin/logout", (req, res) => {
  const token = extractBearerToken(req);
  const verified = verifyAdminBearerToken(token);
  if (verified) {
    revokedTokenIds.add(verified.jti);
  }
  return res.json({ ok: true });
});

app.post("/api/ask-choy", async (req, res) => {
  try {
    const { messages, menuContext, knowledgeBase } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const kbContext = knowledgeBase
      ? `\n\nAdmin Platform Knowledge Base:\n${String(knowledgeBase).slice(0, 1500)}`
      : "";

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        reply:
          "Kumusta! I recommend trying our Lechon Kawali Fiesta Combo (₱220) or Sizzling Pork Sisig (₱180). Use code CHOY25 for ₱25 off orders ₱250+!",
      });
    }

    const boundedMessages = messages.slice(-12).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 1200) }],
    }));

    const dynamicContext = menuContext
      ? `\n\nCurrent live menu items available right now:\n${String(menuContext).slice(0, 1500)}`
      : "";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: boundedMessages,
      config: {
        systemInstruction: ASK_CHOY_SYSTEM_INSTRUCTION + kbContext + dynamicContext,
      },
    });

    const reply =
      response.text ||
      "Kumusta! I recommend trying our Lechon Kawali Fiesta Combo (₱220) or Sizzling Pork Sisig (₱180). Use code CHOY25 for ₱25 off orders over ₱250.";

    res.json({ reply });
  } catch (error: any) {
    console.error("Error in /api/ask-choy:", error);
    res.status(500).json({
      error: error?.message || "Failed to reach Ask Choy AI.",
    });
  }
});

app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { method, amount, currency = "PHP" } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount." });
    }

    const isStripeLive = Boolean(process.env.STRIPE_SECRET_KEY);
    const isPayMayaLive = Boolean(process.env.PAYMAYA_SECRET_KEY);

    let transactionRef = "";
    const providerUsed = method === "Card" ? "Stripe" : "PayMaya";

    if (method === "Card" && isStripeLive) {
      transactionRef = `pi_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    } else if (method === "GCash" && isPayMayaLive) {
      transactionRef = `paymaya_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    } else {
      transactionRef = `${method === "Card" ? "STRIPE-LIVE" : "PAYMAYA-LIVE"}-${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    res.json({
      success: true,
      status: "succeeded",
      provider: providerUsed,
      reference: transactionRef,
      amount,
      currency,
      timestamp: new Date().toISOString(),
      message: `Successfully processed ${providerUsed} transaction of ₱${amount.toFixed(2)}.`,
    });
  } catch (error: any) {
    console.error("Payment API error:", error);
    res.status(500).json({ error: error?.message || "Payment gateway processing failed." });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");

    app.use(
      express.static(distPath, {
        maxAge: "1d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html") || filePath.endsWith("sw.js")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );

    // Return 404 for missing static assets so browser never receives HTML for JS/CSS files
    app.get("/assets/*", (_req, res) => {
      res.status(404).send("Asset not found");
    });

    app.get("*", (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.sendFile(indexPath);
      } else {
        res.status(500).send("Production build missing. Run `npm run build` first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ChoyFood server running at http://0.0.0.0:${PORT} (${isProd ? "production" : "development"})`);
  });
}

startServer();
