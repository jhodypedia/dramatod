import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../middleware/auth.js";
import { Admin, Settings, Stats } from "../models/index.js";

const r = Router();

r.get("/login", (req, res) => res.renderPartial("admin/login", { title: "Admin Login" }));

r.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ where: { username } });
  if (!admin) return res.renderPartial("admin/login", { title: "Admin Login", error: "User tidak ditemukan" });
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.renderPartial("admin/login", { title: "Admin Login", error: "Password salah" });
  req.session.admin = { id: admin.id, username: admin.username };
  res.redirect(req.query.next || "/admin");
});

r.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/admin/login");
});

r.get("/", requireAdmin, async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const today = await Stats.findOne({ where: { date: todayStr } }) || { visitors:0, pageviews:0, adClicks:0 };

  const last7 = await Stats.findAll({ order: [["date","ASC"]], limit: 7 });
  const labels = last7.map(r => r.date);
  const visitors = last7.map(r => r.visitors);
  const pageviews = last7.map(r => r.pageviews);
  const adClicks = last7.map(r => r.adClicks);

  res.renderPartial("admin/dashboard", {
    title: "Dashboard Admin",
    today, labels, visitors, pageviews, adClicks
  });
});

r.get("/settings", requireAdmin, async (req, res) => {
  const s = await Settings.findByPk(1);
  res.renderPartial("admin/settings", { title: "Pengaturan", s: s?.toJSON() || {} });
});

r.post("/settings", requireAdmin, async (req, res) => {
  const s = await Settings.findByPk(1);
  const payload = {
    siteName: req.body.siteName,
    logoUrl: req.body.logoUrl,
    theme: req.body.theme,
    adsHeadScript: req.body.adsHeadScript,
    adsBodyTop: req.body.adsBodyTop,
    adsPlayerOverlayHtml: req.body.adsPlayerOverlayHtml
  };
  if (s) await s.update(payload);
  else await Settings.create({ id: 1, ...payload });
  res.redirect("/admin/settings");
});

export default r;
