function bindLazy(){
  const imgs = document.querySelectorAll("img.lazy");
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const img = e.target;
        const ds = img.getAttribute("data-src");
        if(ds){ img.src = ds; img.onload = ()=> img.classList.remove("blur"); }
        io.unobserve(img);
      }
    })
  }, { rootMargin: "200px" });
  imgs.forEach(i=>io.observe(i));
}
window.addEventListener("DOMContentLoaded", bindLazy);
window.addEventListener("lazy-refresh", bindLazy);
