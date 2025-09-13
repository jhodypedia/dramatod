(function(){
  let io;
  function init() {
    const imgs = document.querySelectorAll("img.lazy.blur");
    if (io) io.disconnect();
    io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const img = entry.target;
          const src = img.getAttribute("data-src");
          if (src) img.src = src;
          img.onload = () => img.classList.remove("blur");
          obs.unobserve(img);
        }
      });
    }, { rootMargin: "200px" });
    imgs.forEach(img=>io.observe(img));
  }
  document.addEventListener("DOMContentLoaded", init);
  window.reinitLazy = init;
})();
