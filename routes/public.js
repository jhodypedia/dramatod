import { Router } from "express";
import axios from "axios";
import xss from "xss";
import { theaterList, searchDrama, chapterList, chapterPage, pickStreamUrl } from "../utils/dramabox.js";
import { Stats, Settings } from "../models/index.js";

const r = Router();

// 🏠 Homepage
r.get("/", async (req, res) => {
  const trending = await theaterList(1, 43);
  const settings = await Settings.findOne() || {};
  res.renderPartial("index", {
    title: "Beranda",
    hero: trending[0] || null,
    rows: [{ title: "Trending", slug: "trending", items: trending }],
    page: 1,
    settings
  });
});

// 🔍 Search
r.get("/search", async (req, res) => {
  const q = (req.query.q || "").toString().slice(0, 64);
  const keyword = xss(q);
  const list = keyword ? await searchDrama(keyword) : [];
  const settings = await Settings.findOne() || {};
  res.renderPartial("index", {
    title: keyword ? `Cari: ${keyword}` : "Cari",
    hero: list[0] || null,
    rows: [{ title: `Hasil untuk: ${keyword}`, slug: "search", items: list }],
    page: 1,
    keyword,
    settings
  });
});

// 📑 Detail drama
r.get("/detail/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const settings = await Settings.findOne() || {};
  res.renderPartial("detail", { title: "Detail", bookId, chapters: [], settings });
});

// 🎬 Watch episode
r.get("/watch/:bookId/:index", async (req, res) => {
  const bookId = req.params.bookId;
  const index = parseInt(req.params.index || "1", 10);
  const quality = parseInt(req.query.q || "720", 10);

  const chapters = await chapterList(bookId, index);
  const chapter = chapters.find(c => c.index === index || c.chapterIndex === index) || chapters[0];
  const streamUrl = pickStreamUrl(chapter, quality);
  const settings = await Settings.findOne() || {};

  res.renderPartial("watch", {
    title: `Episode ${index}`,
    bookId,
    index,
    streamUrl,
    chapter,
    chapters: [],
    settings
  });
});

// fallback redirect
r.get("/watch/:bookId", (req, res) => {
  res.redirect(`/watch/${req.params.bookId}/1`);
});

// 📦 API episodes (realtime pagination)
r.get("/api/chapters/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const page = parseInt(req.query.page || "1", 10);
  const perPage = parseInt(req.query.perPage || "20", 10);
  const list = await chapterPage(bookId, page, perPage);
  res.json({ page, perPage, list });
});

// 🖼️ Proxy image
r.get("/img", async (req, res) => {
  try {
    const raw = req.query.url || "";
    if (!raw) return res.status(400).send("Bad request");
    const url = decodeURIComponent(raw);
    const { data, headers } = await axios.get(url, { responseType: "arraybuffer" });
    res.set("Content-Type", headers["content-type"] || "image/jpeg");
    res.send(data);
  } catch (err) {
    console.error("Proxy img error:", err.message);
    res.status(404).send("Not found");
  }
});

// 📊 Track iklan
r.post("/track/ad-click", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  let row = await Stats.findOne({ where: { date: today } });
  if (!row) row = await Stats.create({ date: today, visitors: 0, pageviews: 0, adClicks: 0 });
  row.adClicks++;
  await row.save();
  res.json({ ok: true });
});

// ⚙️ Admin Panel untuk Settings
r.get("/admin/settings", async (req, res) => {
  const settings = await Settings.findOne() || {};
  res.renderPartial("admin/settings", { title: "Settings", settings });
});

r.post("/admin/settings", async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  settings.siteName = req.body.siteName || "DramaBox";
  settings.adsenseCode = req.body.adsenseCode || "";
  await settings.save();
  res.redirect("/admin/settings");
});

export default r;
