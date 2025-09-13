import { Router } from "express";
import axios from "axios";
import xss from "xss";
import { theaterList, searchSuggest, chapterList, pickStreamUrl } from "../utils/dramabox.js";
import { Stats } from "../models/index.js";

const r = Router();

// Homepage: multi-row ala Netflix
r.get("/", async (req, res) => {
  const trending = await theaterList(1, 43);
  const romance  = await theaterList(1, 21);
  const action   = await theaterList(1, 15);
  const newly    = await theaterList(1, 10);

  res.renderPartial("index", {
    title: "Beranda",
    hero: trending?.[0] || null,
    rows: [
      { title: "Trending",  slug: "trending", items: trending || [] },
      { title: "Romance",   slug: "romance",  items: romance  || [] },
      { title: "Action",    slug: "action",   items: action   || [] },
      { title: "Baru Rilis", slug: "newly",   items: newly    || [] }
    ],
    page: 1
  });
});

// Pencarian
r.get("/search", async (req, res) => {
  const q = (req.query.q || "").toString().slice(0, 64);
  const keyword = xss(q);
  const list = keyword ? await searchSuggest(keyword) : [];
  res.renderPartial("index", {
    title: keyword ? `Cari: ${keyword}` : "Cari",
    hero: list?.[0] || null,
    rows: [{ title: `Hasil: ${keyword}`, slug: "hasil", items: list }],
    page: 1,
    keyword
  });
});

// Detail drama → daftar episode
r.get("/detail/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const chapters = await chapterList(bookId, 1);
  res.renderPartial("detail", { title: "Detail", bookId, chapters });
});

// Watch page (server render pertama)
r.get("/watch/:bookId/:index", async (req, res) => {
  const bookId = req.params.bookId;
  const index = parseInt(req.params.index || "1", 10);
  const chapters = await chapterList(bookId, index);
  const chapter = chapters.find(c => c.index === index) || chapters[0];
  const streamUrl = pickStreamUrl(chapter, 0);
  res.renderPartial("watch", { title: `Episode ${index}`, bookId, index, streamUrl, chapter, chapters });
});

// API theater (infinite scroll grid)
r.get("/api/theater", async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const list = await theaterList(page, 43);
  res.json({ page, list });
});

// Proxy gambar
r.get("/img", async (req, res) => {
  try {
    const url = decodeURIComponent(req.query.url || "");
    const { data, headers } = await axios.get(url, { responseType: "arraybuffer" });
    res.set("Content-Type", headers["content-type"] || "image/jpeg");
    res.send(data);
  } catch {
    res.status(404).send("Not found");
  }
});

// Track klik iklan
r.post("/track/ad-click", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  let row = await Stats.findOne({ where: { date: today } });
  if (!row) row = await Stats.create({ date: today, visitors: 0, pageviews: 0, adClicks: 0 });
  row.adClicks++;
  await row.save();
  res.json({ ok: true });
});

export default r;
