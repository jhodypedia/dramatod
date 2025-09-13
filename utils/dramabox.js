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

export async function searchSuggest(keyword) {
  const key = `search:${keyword}`;
  const cached = getCache(key);
  if (cached) return cached;

  const tk = await getToken();
  const url = "https://sapi.dramaboxdb.com/drama-box/search/suggest";
  const { data } = await axios.post(url, { keyword }, { headers: baseHeaders(tk) });
  const list = data?.data?.suggestList || [];
  setCache(key, list, 60_000);
  return list;
}

/**
 * channelId contoh:
 * - 43: default/global
 * - 21: romance (contoh)
 * - 15: action (contoh)
 * - 10: new release (contoh)
 * Ganti sesuai real jika berbeda.
 */
export async function theaterList(pageNo = 1, channelId = 43) {
  const key = `theater:${channelId}:${pageNo}`;
  const cached = getCache(key);
  if (cached) return cached;

  const tk = await getToken();
  const url = "https://sapi.dramaboxdb.com/drama-box/he001/theater";
  const body = { newChannelStyle: 1, isNeedRank: 1, pageNo, index: 1, channelId };
  const { data } = await axios.post(url, body, { headers: baseHeaders(tk) });
  const records = data?.data?.newTheaterList?.records || [];
  setCache(key, records, 120_000);
  return records;
}

export async function chapterList(bookId, index = 1) {
  const key = `chapters:${bookId}:${index}`;
  const cached = getCache(key);
  if (cached) return cached;

  const tk = await getToken();
  const url = "https://sapi.dramaboxdb.com/drama-box/chapterv2/batch/load";
  const body = {
    boundaryIndex: 0, comingPlaySectionId: -1, index,
    currencyPlaySource: "discover_new_rec_new", needEndRecommend: 0,
    currencyPlaySourceName: "", preLoad: false, rid: "", pullCid: "",
    loadDirection: 0, startUpKey: "", bookId
  };
  const { data } = await axios.post(url, body, { headers: baseHeaders(tk) });
  const chapters = data?.data?.chapterList || [];
  setCache(key, chapters, 180_000);
  return chapters;
}

export function pickStreamUrl(chapter, cdnIndex = 0) {
  const cdn = chapter?.cdnList?.[cdnIndex];
  return cdn?.url || null;
}
