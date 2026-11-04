/* phone3d.js — plays a screen recording (or shows a still) on a real 3D iPhone model.
   Usage: <div class="phone3d" data-video="clip.mp4" data-label="..."><img class="p3-poster" src="poster.jpg"></div>
   Optional framing, so the same model can be shown many ways:
     data-image   a still screen instead of data-video
     data-orbit   camera orbit, "yaw pitch radius" (default "0deg 90deg 88%"); dragging stays within ±data-swing degrees
     data-swing   how far it can be dragged, "yaw pitch" in degrees (default "40 18")
     data-fov     field of view (default "11deg"); smaller is closer
     data-target  camera target, "x y z" in metres (default: the model's centre)
     data-orient  model rotation, "roll pitch yaw" (default none)
   The poster shows until the element is near the viewport; the model is created then and
   removed again when it scrolls away, so only a couple of WebGL contexts ever exist.
   Falls back to the poster when WebGL or the library is unavailable, or for reduced motion. */
(function () {
  var LIB = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
  var els = [].slice.call(document.querySelectorAll('.phone3d[data-video], .phone3d[data-image]'));
  if (!els.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var libReady = null;
  function loadLib() {
    if (libReady) return libReady;
    libReady = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.type = 'module'; s.src = LIB; s.onerror = reject;
      s.onload = function () { customElements.whenDefined('model-viewer').then(resolve); };
      document.head.appendChild(s);
    });
    return libReady;
  }

  function limits(orbit, swing) {
    var o = orbit.split(/\s+/), w = (swing || '40 18').split(/\s+/).map(parseFloat);
    var yaw = parseFloat(o[0]), pitch = parseFloat(o[1]), r = o[2] || '88%';
    return [(yaw - w[0]) + 'deg ' + (pitch - w[1]) + 'deg ' + r, (yaw + w[0]) + 'deg ' + (pitch + w[1]) + 'deg ' + r];
  }

  function mount(el) {
    if (el._live) return;
    el._live = true;
    loadLib().then(function () {
      if (!el._live) return;
      var mv = document.createElement('model-viewer');
      var orbit = el.getAttribute('data-orbit') || '0deg 90deg 88%', lim = limits(orbit, el.getAttribute('data-swing'));
      mv.setAttribute('src', el.getAttribute('data-model') || 'assets/case studies/shoal/phone/iphone-18-pro-max.glb');
      mv.setAttribute('camera-orbit', orbit);
      mv.setAttribute('min-camera-orbit', lim[0]);
      mv.setAttribute('max-camera-orbit', lim[1]);
      mv.setAttribute('field-of-view', el.getAttribute('data-fov') || '11deg');
      if (el.getAttribute('data-target')) mv.setAttribute('camera-target', el.getAttribute('data-target'));
      if (el.getAttribute('data-orient')) mv.setAttribute('orientation', el.getAttribute('data-orient'));
      mv.setAttribute('camera-controls', '');
      mv.setAttribute('disable-zoom', '');
      mv.setAttribute('disable-pan', '');
      mv.setAttribute('interaction-prompt', 'none');
      mv.setAttribute('shadow-intensity', '0');
      mv.setAttribute('environment-intensity', '.7');
      mv.setAttribute('tone-mapping', 'neutral'); // keeps the screen's whites white; the default greys them
      mv.setAttribute('aria-label', el.getAttribute('data-label') || 'Interactive 3D phone showing the app');
      mv.addEventListener('load', function () {
        var mat = mv.model.materials.filter(function (m) { return m.name === 'COLOUR_Black_Screen'; })[0];
        if (!mat) return;
        var src = el.getAttribute('data-video'), img = null, vid = null;
        if (src) {
          vid = document.createElement('video');
          vid.src = src; vid.muted = true; vid.loop = true; vid.playsInline = true; vid.crossOrigin = 'anonymous';
          var play = vid.play(); if (play && play.catch) play.catch(function () {});
          el._vid = vid;
        } else {
          img = new Image(); img.src = el.getAttribute('data-image');
        }
        Promise.resolve(mv.createCanvasTexture()).then(function (tex) {
          var cv = tex.source.element; cv.width = 402; cv.height = 874;
          var ctx = cv.getContext('2d');
          var draw = function (media) { ctx.save(); ctx.translate(0, cv.height); ctx.scale(1, -1); ctx.drawImage(media, 0, 0, cv.width, cv.height); ctx.restore(); tex.source.update(); };
          if (vid) {
            (function frame() {
              if (!el._live) return;
              draw(vid);
              el._raf = requestAnimationFrame(frame);
            })();
          } else {
            (img.decode ? img.decode() : Promise.resolve()).then(function () { if (el._live) draw(img); });
          }
          mat.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
          mat.emissiveTexture.setTexture(tex);
          // the screen gives off its own light at full strength, rather than being lit by the room, so it isn't dimmed
          mat.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 1]);
          mat.setEmissiveFactor([1, 1, 1]);
          el.classList.add('is-live');
        });
      });
      el.appendChild(mv);
      el._mv = mv;
    }).catch(function () {
      el._live = false;
      if (el.querySelector('video') || !el.getAttribute('data-video')) return;
      var v = document.createElement('video');
      v.src = el.getAttribute('data-video'); v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
      // play inside the flat CSS phone when there is one, else over the poster
      var still = el.querySelector('.ph img');
      if (still) { v.poster = still.src; still.replaceWith(v); return; }
      v.className = 'p3-poster'; v.style.opacity = 1;
      el.appendChild(v);
    });
  }

  function unmount(el) {
    if (!el._live) return;
    el._live = false;
    cancelAnimationFrame(el._raf);
    if (el._vid) { el._vid.pause(); el._vid.removeAttribute('src'); el._vid.load(); el._vid = null; }
    if (el._mv) { el._mv.remove(); el._mv = null; }
    el.classList.remove('is-live');
  }

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.isIntersecting ? mount(e.target) : unmount(e.target); });
  }, { rootMargin: '120px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
