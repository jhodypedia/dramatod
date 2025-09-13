import { Router } from "express";
import axios from "axios";
import xss from "xss";
import { theaterList, searchDrama, chapterList } from "../utils/dramabox.js";
import { token } from "../utils/get-token.js";
import { Stats } from "../models/index.js";

const r = Router();

/* =====================
   Homepage
===================== */
r.get("/", async (req, res) => {
  const trending = await theaterList(1, 43);
  res.renderPartial("index", {
    title: "Beranda",
    hero: trending[0] || null,
    rows: [{ title: "Trending", slug: "trending", items: trending }],
    page: 1
  });
});

/* =====================
   Search
===================== */
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

/* =====================
   Detail Drama
===================== */
r.get("/detail/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  const chapters = await chapterList(bookId, 1);
  res.renderPartial("detail", { title: "Detail", bookId, chapters });
});

/* =====================
   Watch Episode
===================== */
r.get("/watch/:bookId/:index", async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const index = parseInt(req.params.index || "1", 10);

    // ambil token
    const gettoken = await token();
    const url = "https://sapi.dramaboxdb.com/drama-box/chapterv2/batch/load";

    const headers = {
      "User-Agent": "okhttp/4.10.0",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
      "tn": `Bearer ${gettoken.token}`,
      "version": "430",
      "vn": "4.3.0",
      "cid": "DRA1000000",
      "package-name": "com.storymatrix.drama",
      "apn": "1",
      "device-id": gettoken.deviceid,
      "language": "in",
      "current-language": "in",
      "p": "43",
      "time-zone": "+0800"
    };

    const data = {
      boundaryIndex: 0,
      comingPlaySectionId: -1,
      index,
      currencyPlaySource: "discover_new_rec_new",
      needEndRecommend: 0,
      preLoad: false,
      rid: "",
      pullCid: "",
      loadDirection: 0,
      startUpKey: "",
      bookId
    };

    const resApi = await axios.post(url, data, { headers });
    const chapters = resApi.data?.data?.chapterList || [];

    const chapter = chapters.find(ch => ch.index === index) || chapters[0];
    const streamUrl = chapter?.cdnList?.[0]?.url || null;

    if (!streamUrl) {
      console.warn("⚠️ Stream URL kosong untuk", bookId, "episode", index);
    } else {
      console.log("▶️ Stream ready:", streamUrl);
    }

    res.renderPartial("watch", {
      title: `Episode ${index}`,
      bookId,
      index,
      streamUrl,
      chapter,
      chapters
    });
  } catch (err) {
    console.error("❌ Error watch route:", err.message);
    res.status(500).send("Gagal mengambil stream");
  }
});

/* fallback ke ep 1 kalau hanya bookId */
r.get("/watch/:bookId", (req, res) => {
  res.redirect(`/watch/${req.params.bookId}/1`);
});

/* =====================
   API Theater (Infinite Scroll)
===================== */
r.get("/api/theater", async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const list = await theaterList(page, 43);
  res.json({ page, list });
});

/* =====================
   Proxy Gambar
===================== */
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

/* =====================
   Track Ad Click
===================== */
r.post("/track/ad-click", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  let row = await Stats.findOne({ where: { date: today } });
  if (!row) row = await Stats.create({ date: today, visitors: 0, pageviews: 0, adClicks: 0 });
  row.adClicks++;
  await row.save();
  res.json({ ok: true });
});

export default r;
