import express from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieSession from "cookie-session";
import expressLayouts from "express-ejs-layouts";

import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

import { initDb, Settings } from "./models/index.js";
import { seedAdminAndSettings } from "./models/seed.js";
import { trackStats } from "./middleware/stats.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.resolve("views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("tiny"));
app.use("/public", express.static(path.resolve("public")));

app.use(cookieSession({
  name: "sess",
  keys: [process.env.SESSION_KEY || "dev_secret_key_change_me"],
  maxAge: 24 * 60 * 60 * 1000
}));

// partial render helper (SPA feel)
app.use((req, res, next) => {
  res.renderPartial = (view, params = {}) => {
    if (req.get("X-Partial")) res.render(view, { ...params, layout: false });
    else res.render(view, params);
  };
  next();
});

// rate limit utk /api
app.use("/api", rateLimit({ windowMs: 60_000, max: 120 }));

// inject settings & admin flag
app.use(async (req, res, next) => {
  const s = await Settings.findByPk(1);
  res.locals.settings = s ? s.toJSON() : {};
  res.locals.isAdmin = !!req.session?.admin;
  next();
});

// statistik (visitor unik per sesi + pageview)
app.use(trackStats);

// routes
app.use("/", publicRoutes);
app.use("/admin", adminRoutes);

// DB init & seed
await initDb();
await seedAdminAndSettings();

app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
