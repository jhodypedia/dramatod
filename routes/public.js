import { Router } from "express";
import axios from "axios";
import xss from "xss";
import { theaterList, searchDrama, chapterList, chapterPage, pickStreamUrl } from "../utils/dramabox.js";
import { Stats, Settings } from "../models/index.js";

const r = Router();

// homepage
r.get("/", async (req,res)=>{
  const trending = await theaterList(1,43);
  const s = await Settings.findByPk(1);
  res.renderPartial("index", {
    title:"Beranda",
    hero: trending[0] || null,
    rows: [{ title:"Trending", items: trending }],
    page: 1,
    s: s?.toJSON() || {}
  });
});

// search
r.get("/search", async (req,res)=>{
  const keyword = xss((req.query.q||"").toString().slice(0,64));
  const list = keyword ? await searchDrama(keyword) : [];
  const s = await Settings.findByPk(1);
  res.renderPartial("index", {
    title: keyword ? `Cari: ${keyword}` : "Cari",
    hero: list[0] || null,
    rows: [{ title: `Hasil untuk: ${keyword}`, items: list }],
    page: 1,
    s: s?.toJSON() || {}
  });
});

// detail page (episodes via AJAX)
r.get("/detail/:bookId", async (req,res)=>{
  const s = await Settings.findByPk(1);
  res.renderPartial("detail", { title:"Detail", bookId:req.params.bookId, s: s?.toJSON() || {} });
});

// watch page
r.get("/watch/:bookId/:index", async (req, res) => {
  const bookId = req.params.bookId;
  const index = Math.max(1, parseInt(req.params.index || "1", 10));
  const quality = parseInt(req.query.q || "720", 10);

  const chapters = await chapterList(bookId, index);
  let chapter = chapters.find(c => c.index === index || c.chapterIndex === index) || chapters[0];

  const stream = pickStreamUrl(chapter, quality);
  const s = await Settings.findByPk(1);

  res.renderPartial("watch", {
    title: `Episode ${index}`,
    bookId,
    index,
    stream,
    chapter,
    s: s?.toJSON() || {}
  });
});

r.get("/watch/:bookId", (req,res)=> res.redirect(`/watch/${req.params.bookId}/1`));

// API: theater for infinite scroll
r.get("/api/theater", async (req,res)=>{
  const page = parseInt(req.query.page||"1",10);
  res.json({ page, list: await theaterList(page,43) });
});

// API: chapters realtime + cache
r.get("/api/chapters/:bookId", async (req,res)=>{
  const page = parseInt(req.query.page||"1",10);
  const perPage = parseInt(req.query.perPage||"20",10);
  const list = await chapterPage(req.params.bookId, page, perPage);
  res.json({ page, perPage, list });
});

// img proxy
r.get("/img", async (req,res)=>{
  try{
    const url = decodeURIComponent(req.query.url||"");
    const { data, headers } = await axios.get(url, { responseType:"arraybuffer" });
    res.set("Content-Type", headers["content-type"] || "image/jpeg");
    res.send(data);
  }catch(e){
    res.status(404).send("Not found");
  }
});

// stats: ad click
r.post("/track/ad-click", async (req,res)=>{
  const today = new Date().toISOString().split("T")[0];
  let row = await Stats.findOne({ where:{ date: today } });
  if(!row) row = await Stats.create({ date: today, visitors:0, pageviews:0, adClicks:0 });
  row.adClicks++; await row.save();
  res.json({ ok:true });
});

export default r;
