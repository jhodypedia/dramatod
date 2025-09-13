const store = new Map(); // key -> { value, exp }

export function setCache(key, value, ttlSec = 300) {
  store.set(key, { value, exp: Date.now() + ttlSec * 1000 });
}
export function getCache(key) {
  const v = store.get(key);
  if (!v) return null;
  if (Date.now() > v.exp) { store.delete(key); return null; }
  return v.value;
}
