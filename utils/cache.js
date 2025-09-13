const cache = new Map();

export function setCache(key, value, ttl = 120000) {
  cache.set(key, { value, expire: Date.now() + ttl });
}
export function getCache(key) {
  const c = cache.get(key);
  if (!c) return null;
  if (Date.now() > c.expire) { cache.delete(key); return null; }
  return c.value;
}
