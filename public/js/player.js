window.initHlsPlayer = (elId, url) => {
  if (!url) return;
  const video = document.getElementById(elId);
  if (!video) return;
  if (window.Hls && Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  } else {
    alert("Browser tidak mendukung HLS");
  }
};
