import express from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieSession from "cookie-session";
import expressLayouts from "express-ejs-layouts";
import { fileURLToPath } from "url";

import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

import { initDb, Settings } from "./models/index.js";
import { seedAdminAndSettings } from "./models/seed.js";
import { trackStats } from "./middleware/stats.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main"); // pakai layouts/main.ejs

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false })); // disable CSP untuk script adsense
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use(
  cookieSession({
    name: "sess",
    keys: [process.env.SESSION_KEY || "dev_secret_key_change_me"],
    maxAge: 24 * 60 * 60 * 1000 // 1 hari
  })
);

// helper renderPartial untuk SPA feel (X-Partial header)
app.use((req, res, next) => {
  res.renderPartial = (view, params = {}) => {
    if (req.get("X-Partial")) res.render(view, { ...params, layout: false });
    else res.render(view, params);
  };
  next();
});

// rate limit untuk API
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// inject settings (untuk layout global) + flag admin
app.use(async (req, res, next) => {
  try {
    const s = await Settings.findByPk(1);
    res.locals.settings = s ? s.toJSON() : {};
    res.locals.isAdmin = !!req.session?.admin;
  } catch (err) {
    console.error("Settings middleware error:", err.message);
    res.locals.settings = {};
    res.locals.isAdmin = false;
  }
  next();
});

// statistik pengunjung & pageviews
app.use(trackStats);

// routes
app.use("/", publicRoutes);
app.use("/admin", adminRoutes);

// database init & seeder
await initDb();
await seedAdminAndSettings();

// start server
app.listen(PORT, () =>
  console.log(`🚀 Server running → http://localhost:${PORT}`)
);
