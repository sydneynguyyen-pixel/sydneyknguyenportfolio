/* ══════════════════════════════════════════════════════════════════════
   SHARED MUSIC PLAYER — persists playback across page navigations.

   A multi-page site tears down the <audio> element on every navigation, so
   true gapless playback isn't possible without an SPA/iframe shell. Instead
   this module saves {track, time, playing, volume} to localStorage and, on
   each new page, recreates the player, seeks to where you left off, and
   resumes — so music "keeps going" across screens with only a tiny load gap.

   Loaded on the non-homepage desktop pages. The homepage (index.html) has its
   own copy of this player in script.js; it reads/writes the SAME localStorage
   schema (STORE_KEY) so playback flows in and out of the homepage.

   Robustness against multiple live page instances (e.g. back/forward cache):
   - Each page pauses its own audio on pagehide, so a backgrounded/cached page
     can't keep playing (double audio) or clobber the shared position.
   - On bfcache restore (pageshow.persisted) the page re-syncs from storage.
   - saveState() defers to another page that is actively playing (ownership),
     so a stale instance never overwrites the live one.

   IMPORTANT: TRACKS here must mirror CDP_TRACKS in script.js (same order, so
   the saved track index maps correctly). If you change one, change both.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__snMusicInit || document.getElementById('cdplayer')) return;
  window.__snMusicInit = true;

  var STORE_KEY = 'sydney_music_v1';
  var SESSION = Math.random().toString(36).slice(2); // this page instance's id

  var TRACKS = [
    { title:'悲しい夢',    artist:'tavc city pop',    src:'assets/music/tavc city pop - 悲しい夢.mp3',    art:'assets/music/song 5 cover.webp', color:'#302010' },
    { title:'glitch',     artist:'alex morgan',      src:'assets/music/alex morgan - glitch.mp3',        art:'assets/music/song 1 cover.webp', color:'#2e4d36' },
    { title:'backyard',   artist:'lofium',           src:'assets/music/lofium - backyard.mp3',           art:'assets/music/song 2 cover.webp', color:'#1e3050' },
    { title:'city tour',  artist:'salaidawtsang11',  src:'assets/music/salaidawtsang11 - city tour.mp3', art:'assets/music/song 3 cover.webp', color:'#4a1e30' },
    { title:'jazzy love', artist:'sonican',          src:'assets/music/sonican - jazzy love.mp3',        art:'assets/music/song 4 cover.webp', color:'#2a3a18' },
  ];

  var PLAY_SVG  = '<svg class="cdp-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var PAUSE_SVG = '<svg class="cdp-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

  var CSS = ''
    + '.corner-controls{position:fixed;right:24px;bottom:24px;display:flex;align-items:center;gap:12px;z-index:200;}'
    + '.corner-peeker{position:static;width:40px;height:40px;padding:0;background:none;border:none;box-shadow:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:visible;transition:transform .2s cubic-bezier(.34,1.56,.64,1);}'
    + '.corner-peeker:hover{transform:scale(1.12);}'
    + '#music-peeker .fab-doodle{width:24px;height:24px;display:block;color:var(--ink,#1a1a1a);}'
    + '#cdplayer{position:fixed;right:24px;bottom:76px;left:auto;top:auto;width:300px;max-width:calc(100vw - 48px);z-index:190;background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,.08);box-shadow:0 10px 34px rgba(0,0,0,.16);padding:14px;display:flex;flex-direction:column;gap:10px;transform-origin:bottom right;opacity:0;transform:scale(.96) translateY(8px);pointer-events:none;transition:opacity .2s ease,transform .2s cubic-bezier(.34,1.56,.64,1);}'
    + '#cdplayer.open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;}'
    + '.cdp-close{position:absolute;top:8px;right:8px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:none;border-radius:50%;color:#888;background:rgba(0,0,0,.05);z-index:2;cursor:pointer;transition:background .15s,color .15s;}'
    + '.cdp-close:hover{background:rgba(0,0,0,.1);color:#1a1a1a;}'
    + '.cdp-top{display:flex;align-items:center;gap:12px;}'
    + '.cdp-art-wrap{position:relative;width:72px;height:72px;flex-shrink:0;border-radius:50%;overflow:hidden;}'
    + '.cdp-art-wrap.spinning .cdp-art-inner{animation:cdpSpin 8s linear infinite;}'
    + '@keyframes cdpSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}'
    + '.cdp-art-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;}'
    + '.cdp-art-img{width:100%;height:100%;object-fit:cover;display:block;}'
    + '.cdp-waveform{position:absolute;bottom:6px;left:6px;display:flex;align-items:flex-end;gap:2px;height:16px;opacity:0;transition:opacity .2s;pointer-events:none;}'
    + '.cdp-waveform.playing{opacity:1;}'
    + '.cdp-waveform span{width:3px;border-radius:2px;background:rgba(255,255,255,.9);height:30%;}'
    + '.cdp-waveform.playing span:nth-child(1){animation:cdpWave .9s ease infinite 0s;}'
    + '.cdp-waveform.playing span:nth-child(2){animation:cdpWave .9s ease infinite .18s;}'
    + '.cdp-waveform.playing span:nth-child(3){animation:cdpWave .9s ease infinite .09s;}'
    + '.cdp-waveform.playing span:nth-child(4){animation:cdpWave .9s ease infinite .27s;}'
    + '.cdp-waveform.playing span:nth-child(5){animation:cdpWave .9s ease infinite .13s;}'
    + '@keyframes cdpWave{0%,100%{height:20%}50%{height:100%}}'
    + '.cdp-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}'
    + '.cdp-track-name{font-size:13px;font-weight:500;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.cdp-track-artist{font-size:11px;color:#aaa;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    + '.cdp-track-dots{display:flex;gap:4px;margin-top:6px;}'
    + '.cdp-td{width:24px;height:22px;border-radius:6px;font-size:10px;font-weight:500;color:#888;background:rgba(0,0,0,.06);border:1px solid rgba(0,0,0,.08);cursor:pointer;padding:0;transition:background .15s,color .15s;}'
    + '.cdp-td:hover:not(.active){background:rgba(0,0,0,.1);color:#444;}'
    + '.cdp-td.active{background:#1a1a1a;color:#fff;border-color:transparent;}'
    + '.cdp-time-row{display:flex;align-items:center;gap:8px;width:100%;}'
    + '#cdp-time-cur,#cdp-time-total{font-size:10px;color:#ccc;font-weight:400;flex-shrink:0;min-width:28px;font-variant-numeric:tabular-nums;}'
    + '#cdp-time-total{text-align:right;}'
    + '.cdp-progress-wrap{flex:1;height:3px;background:rgba(0,0,0,.08);border-radius:2px;overflow:hidden;cursor:pointer;}'
    + '.cdp-progress-fill{height:100%;width:0%;background:#1a1a1a;border-radius:2px;transition:width .5s linear;}'
    + '.cdp-bottom{display:flex;flex-direction:column;align-items:center;gap:8px;}'
    + '.cdp-controls{display:flex;align-items:center;gap:6px;}'
    + '.cdp-ctrl-btn{width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:#555;background:none;border:none;border-radius:8px;cursor:pointer;transition:background .15s,color .15s,transform .12s;}'
    + '.cdp-ctrl-btn:hover{background:rgba(0,0,0,.06);color:#1a1a1a;}'
    + '.cdp-ctrl-btn:active{transform:scale(.92);}'
    + '.cdp-play-btn{width:34px;height:34px;background:#1a1a1a;color:#fff;border-radius:50%;}'
    + '.cdp-play-btn:hover{background:#333;color:#fff;}'
    + '.cdp-vol-slider{width:100%;-webkit-appearance:none;appearance:none;height:3px;background:rgba(0,0,0,.1);border-radius:2px;outline:none;}'
    + '.cdp-vol-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#1a1a1a;cursor:pointer;border:none;box-shadow:0 1px 4px rgba(0,0,0,.2);}'
    + '@media (max-width:768px){.corner-controls,#cdplayer{display:none !important;}}';

  var MARKUP = ''
    + '<div class="corner-controls" id="corner-controls">'
    + '  <button id="music-peeker" class="corner-peeker" title="music player" aria-label="Music player" aria-expanded="false">'
    + '    <svg class="fab-doodle" viewBox="1 4 56 60" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '      <path d="M23 51 L23 16" /><path d="M53 45 L53 10" />'
    + '      <path d="M23 16 L53 10" /><path d="M23 24 L53 18" />'
    + '      <ellipse cx="15" cy="55" rx="9" ry="6.5" transform="rotate(-20 15 55)" />'
    + '      <ellipse cx="45" cy="49" rx="9" ry="6.5" transform="rotate(-20 45 49)" />'
    + '    </svg>'
    + '  </button>'
    + '</div>'
    + '<div class="cdplayer" id="cdplayer">'
    + '  <button class="cdp-close" title="close" aria-label="Close music player"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
    + '  <div class="cdp-top">'
    + '    <div class="cdp-art-wrap" id="cdp-disc"><div id="cdp-disc-color" class="cdp-art-inner"><img class="cdp-art-img" id="cdp-disc-art" src="" alt="" /></div>'
    + '      <div class="cdp-waveform" id="cdp-waveform"><span></span><span></span><span></span><span></span><span></span></div>'
    + '    </div>'
    + '    <div class="cdp-meta">'
    + '      <div class="cdp-track-name" id="cdp-track-name"></div>'
    + '      <div class="cdp-track-artist" id="cdp-track-artist"></div>'
    + '      <div class="cdp-track-dots" id="cdp-track-dots"></div>'
    + '    </div>'
    + '  </div>'
    + '  <div class="cdp-time-row"><span id="cdp-time-cur">0:00</span><div class="cdp-progress-wrap" id="cdp-progress-wrap"><div class="cdp-progress-fill" id="cdp-progress-fill"></div></div><span id="cdp-time-total">–:––</span></div>'
    + '  <div class="cdp-bottom">'
    + '    <div class="cdp-controls">'
    + '      <button class="cdp-ctrl-btn" id="cdp-prev"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>'
    + '      <button class="cdp-ctrl-btn cdp-play-btn" id="cdp-play-btn">' + PLAY_SVG + '</button>'
    + '      <button class="cdp-ctrl-btn" id="cdp-next"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18 14.5 12 6 6v12zM16 6h2v12h-2z"/></svg></button>'
    + '    </div>'
    + '    <input type="range" class="cdp-vol-slider" id="cdp-vol" min="0" max="1" step="0.01" value="1" />'
    + '  </div>'
    + '</div>';

  function init() {
    var style = document.createElement('style');
    style.id = 'sn-music-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    var holder = document.createElement('div');
    holder.innerHTML = MARKUP;
    while (holder.firstChild) document.body.appendChild(holder.firstChild);

    var audio = new Audio();
    audio.loop = false;

    var el = function (id) { return document.getElementById(id); };
    var disc = el('cdp-disc'), wave = el('cdp-waveform'),
        playBtn = el('cdp-play-btn'), player = el('cdplayer'), peeker = el('music-peeker');

    var current = 0;
    var lastSave = 0;
    var leaving = false;   // true while this page is being hidden/unloaded
    var restoring = false; // true while seeking to a restored position (suppress saves)

    function fmt(s) {
      if (!isFinite(s)) return '0:00';
      var m = Math.floor(s / 60), sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function readState() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
    }

    function saveState() {
      // Don't persist a transient position while we're still seeking to the
      // restored spot (a save here would write time 0 and clobber the state).
      if (restoring) return;
      // Only the page the user is actually viewing may write. Backgrounded or
      // bfcached instances are 'hidden' and must never touch the shared state
      // (the `leaving` exception lets the active page do its final handoff save
      // from pagehide, when visibility has already flipped to hidden).
      if (document.visibilityState !== 'visible' && !leaving) return;
      var playing = !audio.paused;
      var prev = readState();
      // Ownership: only the page that's actively playing writes. Another page
      // "owns" playback while it keeps a fresh heartbeat (it re-saves ~1×/sec).
      // If that heartbeat goes stale (>1.5s) it has gone silent (navigated away),
      // so this page may take over. Prevents backgrounded/bfcached instances
      // from clobbering the live one's position.
      var mayWrite = !prev || !prev.owner || prev.owner === SESSION ||
                     !prev.playing || (Date.now() - prev.ts) > 1500;
      if (!mayWrite) return;
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          track: current, time: audio.currentTime || 0, playing: playing,
          vol: audio.volume, ts: Date.now(),
          owner: playing ? SESSION : (prev ? prev.owner : SESSION)
        }));
      } catch (e) {}
    }

    var dots = el('cdp-track-dots');
    TRACKS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'cdp-td' + (i === 0 ? ' active' : '');
      b.textContent = String(i + 1);
      b.addEventListener('click', function () { selectTrack(i, true); });
      dots.appendChild(b);
    });

    function renderTrack(i) {
      var t = TRACKS[i];
      [].forEach.call(document.querySelectorAll('.cdp-td'), function (d, idx) {
        d.classList.toggle('active', idx === i);
      });
      var art = el('cdp-disc-art'), col = el('cdp-disc-color');
      if (t.art) { art.src = t.art; art.style.display = 'block'; } else { art.style.display = 'none'; }
      if (col) col.style.background = t.color;
      el('cdp-track-name').textContent = t.title;
      el('cdp-track-artist').textContent = t.artist;
    }

    function selectTrack(i, autoplay) {
      current = i;
      renderTrack(i);
      el('cdp-progress-fill').style.width = '0%';
      el('cdp-time-cur').textContent = '0:00';
      audio.src = TRACKS[i].src;
      audio.load();
      if (autoplay) audio.play().catch(function () {});
      saveState();
    }

    function togglePlay() {
      if (audio.paused) audio.play().catch(function () {}); else audio.pause();
    }

    function setPlayingUI(on) {
      playBtn.innerHTML = on ? PAUSE_SVG : PLAY_SVG;
      disc.classList.toggle('spinning', on);
      wave.classList.toggle('playing', on);
    }

    audio.addEventListener('play', function () { setPlayingUI(true); saveState(); });
    audio.addEventListener('pause', function () {
      setPlayingUI(false);
      if (!leaving) saveState(); // a pause caused by navigating away shouldn't wipe the "playing" flag
    });
    audio.addEventListener('ended', function () {
      setPlayingUI(false);
      el('cdp-progress-fill').style.width = '0%';
      saveState();
    });
    audio.addEventListener('timeupdate', function () {
      var cur = audio.currentTime, dur = audio.duration || 0;
      el('cdp-time-cur').textContent = fmt(cur);
      el('cdp-time-total').textContent = fmt(dur);
      if (dur > 0) el('cdp-progress-fill').style.width = (cur / dur * 100) + '%';
      var now = Date.now();
      if (now - lastSave > 1000) { lastSave = now; saveState(); }
    });

    playBtn.addEventListener('click', togglePlay);
    el('cdp-prev').addEventListener('click', function () { selectTrack((current - 1 + TRACKS.length) % TRACKS.length, !audio.paused); });
    el('cdp-next').addEventListener('click', function () { selectTrack((current + 1) % TRACKS.length, !audio.paused); });
    el('cdp-vol').addEventListener('input', function () { audio.volume = this.value; saveState(); });
    el('cdp-progress-wrap').addEventListener('click', function (e) {
      var r = this.getBoundingClientRect();
      if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });

    function togglePopup(e) {
      if (e) e.stopPropagation();
      var opening = !player.classList.contains('open');
      player.classList.toggle('open', opening);
      peeker.setAttribute('aria-expanded', opening ? 'true' : 'false');
    }
    function closePopup() {
      if (!player.classList.contains('open')) return;
      player.classList.remove('open');
      peeker.setAttribute('aria-expanded', 'false');
    }
    peeker.addEventListener('click', togglePopup);
    player.querySelector('.cdp-close').addEventListener('click', closePopup);
    document.addEventListener('pointerdown', function (e) {
      if (!player.classList.contains('open')) return;
      if (e.target.closest('#cdplayer') || e.target.closest('#music-peeker')) return;
      closePopup();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });

    // Load the given saved state into this page: seek + (optionally) resume.
    function applyState(saved) {
      if (!saved || typeof saved.track !== 'number' || !TRACKS[saved.track]) return;
      restoring = true;
      current = saved.track;
      renderTrack(current);
      if (audio.src.indexOf(encodeURI(TRACKS[current].src).split('/').pop()) === -1) {
        audio.src = TRACKS[current].src;
        audio.load();
      }
      if (typeof saved.vol === 'number') { audio.volume = saved.vol; el('cdp-vol').value = saved.vol; }
      var seekTo = saved.time || 0;
      var afterSeek = function () {
        if (!saved.playing) return;
        var tryResume = function () { if (audio.paused) audio.play().catch(function () {}); };
        tryResume(); // often allowed after the user has already played media here
        var onGesture = function () {
          tryResume();
          if (!audio.paused) {
            document.removeEventListener('pointerdown', onGesture);
            document.removeEventListener('keydown', onGesture);
          }
        };
        document.addEventListener('pointerdown', onGesture);
        document.addEventListener('keydown', onGesture);
      };
      var seek = function () { try { audio.currentTime = seekTo; } catch (e) {} restoring = false; afterSeek(); };
      if (audio.readyState >= 1) seek();
      else audio.addEventListener('loadedmetadata', seek, { once: true });
    }

    // On leaving, record the live position + pause this instance so a cached
    // copy of the page can't linger, double up, or overwrite the shared state.
    window.addEventListener('pagehide', function () {
      leaving = true;
      if (!audio.paused) saveState(); // only the actively-playing page hands off
      audio.pause();
    });
    // Restored from bfcache: re-sync to the freshest shared state.
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { leaving = false; applyState(readState()); }
    });

    // Initial load
    var saved = readState();
    if (saved && typeof saved.track === 'number' && TRACKS[saved.track]) {
      applyState(saved);
    } else {
      renderTrack(0);
      audio.src = TRACKS[0].src;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
