import { Router } from "express";
import axios from "axios";
import xss from "xss";
import { theaterList, searchDrama, chapterList, pickStreamUrl } from "../utils/dramabox.js";
import { Stats } from "../models/index.js";

const r = Router();

// 🏠 Homepage
r.get("/", async (req, res) => {
  const trending = await theaterList(1, 43);
  res.renderPartial("index", {
    title: "Beranda",
    hero: trending[0] || null,
    rows: [{ title: "Trending", slug: "trending", items: trending }],
    page: 1
  });
});

// 🔍 Search
r.get("/search", async (req, res) => {
  const q = (req.query.q || "").toString().slice(0, 64);
  const keyword = xss(q);
  const list = keyword ? await searchDrama(keyword) : [];
  res.renderPartial("index", {
    title: keyword ? `Cari: ${keyword}` : "Cari",
    hero: list[0] || null,
    rows: [{ title: `Hasil untuk: ${keyword}`, slug: "search", items: list }],
    page: 1,
    keyword
  });
});

// 📑 Detail (list episode)
r.get("/detail/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const chapters = await chapterList(bookId, 1);
  res.renderPartial("detail", { title: "Detail", bookId, chapters });
});

// 🎬 Watch (stream episode)
r.get("/watch/:bookId/:index", async (req, res) => {
  const bookId = req.params.bookId;
  const index = parseInt(req.params.index || "1", 10);
  const quality = parseInt(req.query.q || "720", 10); // default kualitas 720p

  const chapters = await chapterList(bookId, index);
  const chapter = chapters.find(c => c.index === index) || chapters[0];
  const streamUrl = pickStreamUrl(chapter, quality);

  res.renderPartial("watch", {
    title: `Episode ${index}`,
    bookId,
    index,
    streamUrl,
    chapter,
    chapters
  });
});

// 🔀 Fallback: kalau cuma bookId → redirect ke episode 1
r.get("/watch/:bookId", (req, res) => {
  res.redirect(`/watch/${req.params.bookId}/1`);
});

// 📦 API theater (untuk infinite scroll grid)
r.get("/api/theater", async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const list = await theaterList(page, 43);
  res.json({ page, list });
});

// 🖼️ Proxy gambar (supaya thumbnail tampil)
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

// 📊 Track klik iklan
r.post("/track/ad-click", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  let row = await Stats.findOne({ where: { date: today } });
  if (!row) row = await Stats.create({ date: today, visitors: 0, pageviews: 0, adClicks: 0 });
  row.adClicks++;
  await row.save();
  res.json({ ok: true });
});

export default r;
