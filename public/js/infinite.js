let currentPage = window.__START_PAGE__ || 1, loading=false, done=false;
async function loadMore(){
  if(loading||done) return; loading=true;
  const res = await fetch(`/api/theater?page=${currentPage+1}`); const data = await res.json();
  const list = data.list || []; if(!list.length){ done=true; document.getElementById("loader").style.display="none"; return; }
  const grid = document.getElementById("grid");
  list.forEach(item=>{
    const cover = item.cover || item.coverImg || item.hCover || item.hSmallCover || item.verticalCover || item.coverWap || '';
    const div = document.createElement("a"); div.className="item card hover3d"; div.href="/detail/"+(item.bookId||item.id);
    div.innerHTML = `<div class="thumb shimmer"><img src="/img?url=${encodeURIComponent(cover)}&w=50" data-src="/img?url=${encodeURIComponent(cover)}" class="lazy blur"></div>
                     <div class="meta"><div class="name clamp-1">${item.title||item.bookName||''}</div><div class="muted">${item.playCount||''}</div></div>`;
    grid.appendChild(div);
  });
  currentPage++; loading=false; window.dispatchEvent(new Event("lazy-refresh"));
}
const loader = document.getElementById("loader");
if(loader){ new IntersectionObserver(e=>{ if(e[0].isIntersecting) loadMore(); }).observe(loader); }
