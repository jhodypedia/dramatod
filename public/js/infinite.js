let page = Number(window.__START_PAGE__ || 1);
let loading = false, done = false;

async function loadPage() {
  if (loading || done) return;
  loading = true;
  document.getElementById("loader")?.classList.remove("hidden");
  const res = await fetch(`/api/theater?page=${page}`);
  const { list } = await res.json();
  if (!list || list.length === 0) {
    done = true;
  } else {
    const grid = document.getElementById("grid");
    list.forEach(item => {
      const a = document.createElement("a");
      a.className = "item";
      a.href = `/detail/${item.bookId || item.id}`;
      a.innerHTML = `
        <img src="/img?url=${encodeURIComponent(item.cover || item.coverImg || '')}&w=50"
             data-src="/img?url=${encodeURIComponent(item.cover || item.coverImg || '')}"
             class="lazy blur" alt="poster"/>
      `;
      grid.appendChild(a);
    });
    page++;
  }
  document.getElementById("loader")?.classList.add("hidden");
  loading = false;
  // trigger lazyload untuk item baru
  if (window.reinitLazy) window.reinitLazy();
}

loadPage();
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
    loadPage();
  }
});
