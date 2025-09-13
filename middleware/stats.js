import { Stats } from "../models/index.js";

export async function trackStats(req, res, next) {
  try {
    const today = new Date().toISOString().split("T")[0];
    let row = await Stats.findOne({ where: { date: today } });
    if (!row) row = await Stats.create({ date: today, visitors: 0, pageviews: 0, adClicks: 0 });

    row.pageviews++;
    if (!req.session.visited) {
      row.visitors++;
      req.session.visited = true;
    }
    await row.save();
  } catch (e) {
    console.error("Stats error:", e.message);
  }
  next();
}
