import axios from "axios";
import { token as getToken } from "./get-token.js";
import { getCache, setCache } from "./cache.js";

const baseHeaders = (tk) => ({
  "User-Agent": "okhttp/4.10.0",
  "Accept-Encoding": "gzip",
  "Content-Type": "application/json",
  "tn": `Bearer ${tk.token}`,
  "version": "430",
  "vn": "4.3.0",
  "cid": "DRA1000042",
  "package-name": "com.storymatrix.drama",
  "apn": "1",
  "device-id": tk.deviceid,
  "language": "in",
  "current-language": "in",
  "p": "43",
  "time-zone": "+0800"
});

// 🔎 search drama
export async function searchDrama(keyword) {
  if (!keyword) return [];
  const tk = await getToken();
  const url = "https://sapi.dramaboxdb.com/drama-box/search/suggest";
  const { data } = await axios.post(url, { keyword }, { headers: baseHeaders(tk) });
  return data?.data?.suggestList || [];
}

// 📺 list drama (theater)
export async function theaterList(page = 1, channelId = 43) {
  const key = `theater:${channelId}:${page}`;
  const cached = getCache(key); 
  if (cached) return cached;

  const tk = await getToken();
  const url = "https://sapi.dramaboxdb.com/drama-box/he001/theater";
  const body = { newChannelStyle: 1, isNeedRank: 1, pageNo: page, index: 1, channelId };
  const { data } = await axios.post(url, body, { headers: baseHeaders(tk) });
  const records = data?.data?.newTheaterList?.records || [];
  setCache(key, records);
  return records;
}

// 🎬 daftar episode (chapter list)
export async function chapterList(bookId, index = 1) {
  const tk = await getToken();
  const url = "https://sapi.dramaboxdb.com/drama-box/chapterv2/batch/load";
  const body = {
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
  const { data } = await axios.post(url, body, { headers: baseHeaders(tk) });
  return data?.data?.chapterList || [];
}

// 🎥 ambil link stream sesuai kualitas
export function pickStreamUrl(chapter, quality = 720) {
  if (!chapter?.cdnList?.length) return null;

  for (const cdn of chapter.cdnList) {
    const video = cdn.videoPathList.find(v => v.quality === quality);
    if (video) return video.videoPath;
  }

  // fallback: ambil kualitas pertama yang tersedia
  return chapter.cdnList[0].videoPathList?.[0]?.videoPath || null;
}
