// Fade-in page
document.addEventListener("DOMContentLoaded", ()=> document.body.classList.add("ready") );

// Reveal on scroll
const rev = new IntersectionObserver(es=>{
  es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("reveal-in"); rev.unobserve(e.target); } });
},{ threshold:.08 });
document.querySelectorAll(".reveal").forEach(el=>rev.observe(el));

// Hover 3D tilt
document.querySelectorAll(".hover3d").forEach(el=>{
  el.addEventListener("mousemove", (e)=>{
    const r = el.getBoundingClientRect(); const cx = e.clientX - r.left - r.width/2; const cy = e.clientY - r.top - r.height/2;
    el.style.transform = `perspective(700px) rotateY(${cx/r.width*10}deg) rotateX(${ -cy/r.height*10 }deg) translateY(-2px)`;
  });
  el.addEventListener("mouseleave", ()=> el.style.transform = "");
});

// Hover lift for episodes
document.querySelectorAll(".hoverlift").forEach(el=>{
  el.addEventListener("mouseenter", ()=> el.style.transform="translateY(-4px) scale(1.02)");
  el.addEventListener("mouseleave", ()=> el.style.transform="");
});
