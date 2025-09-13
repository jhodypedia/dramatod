import { Router } from "express";
import bcrypt from "bcryptjs";
import { Admin, Settings, Stats } from "../models/index.js";

const r = Router();

const requireAdmin = (req,res,next)=>{
  if (req.session?.admin) return next();
  return res.redirect(`/admin/login?next=${encodeURIComponent(req.originalUrl)}`);
};

r.get("/login",(req,res)=> res.renderPartial("admin/login",{ title:"Admin Login" }));
r.post("/login", async (req,res)=>{
  const { username, password } = req.body;
  const admin = await Admin.findOne({ where:{ username } });
  if(!admin) return res.renderPartial("admin/login",{ title:"Admin Login", error:"User tidak ditemukan" });
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if(!ok) return res.renderPartial("admin/login",{ title:"Admin Login", error:"Password salah" });
  req.session.admin = { id: admin.id, username: admin.username };
  res.redirect(req.query.next || "/admin");
});
r.get("/logout",(req,res)=>{ req.session=null; res.redirect("/admin/login"); });

r.get("/", requireAdmin, async (req,res)=>{
  const s = await Settings.findByPk(1);
  const last7 = await Stats.findAll({ order:[["date","ASC"]], limit:7 });
  res.renderPartial("admin/dashboard",{
    title:"Dashboard Admin",
    labels: last7.map(x=>x.date),
    visitors: last7.map(x=>x.visitors),
    pageviews: last7.map(x=>x.pageviews),
    adClicks: last7.map(x=>x.adClicks),
    s: s?.toJSON() || {}
  });
});

r.get("/settings", requireAdmin, async (req,res)=>{
  const s = await Settings.findByPk(1);
  res.renderPartial("admin/settings",{ title:"Pengaturan", s: s?.toJSON() || {} });
});
r.post("/settings", requireAdmin, async (req,res)=>{
  let s = await Settings.findByPk(1);
  const payload = {
    siteName: req.body.siteName, logoUrl: req.body.logoUrl, theme: req.body.theme,
    adsHeadScript: req.body.adsHeadScript, adsBodyTop: req.body.adsBodyTop,
    adsPlayerOverlayHtml: req.body.adsPlayerOverlayHtml
  };
  if (s) await s.update(payload); else await Settings.create({ id:1, ...payload });
  res.redirect("/admin/settings");
});

export default r;
