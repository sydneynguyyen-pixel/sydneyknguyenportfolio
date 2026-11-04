/* Plays the real Shoal prototype inside its iPhone frame, with scripted taps.
   Each phone is an iframe of proto/phone.html. A page calls Motion({ ... }) with:
     wide / tall: [width, height] of the stage for wide frames and for tall (phone-width) frames
     setup(m):  puts each phone on its first screen, before anything shows
     play(m):   the timeline. Use m.wait, m.tap, m.type and m.p[i].win (the prototype's window)
     still(m):  the last frame, shown when reduced motion is on
     loop:      false to play once and stay on the last frame
   The animation plays while the frame is on screen, loops, and starts over when it comes back. */
(function(){
  window.Motion = function(cfg){
    var fitEl = document.getElementById('fit'), stage = document.getElementById('stage');
    var frames = [].slice.call(stage.querySelectorAll('iframe'));
    // ?still shows the last frame right away, the same as reduced motion (used to capture the still images)
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /still/.test(location.search);
    var run = 0, scale = 1;

    function fit(){
      var W = fitEl.clientWidth, H = fitEl.clientHeight, tall = H > W;
      document.body.className = tall ? 'tall' : 'wide';
      var s = tall ? cfg.tall : cfg.wide;
      stage.style.width = s[0] + 'px'; stage.style.height = s[1] + 'px';
      scale = Math.min(W / s[0], H / s[1]);
      stage.style.transform = 'translate(-50%,-50%) scale(' + scale + ')';
    }
    addEventListener('resize', fit); fit();

    // Loads every phone and resolves once each prototype has landed in the app.
    // The first time it loads the phones in place. After that it loads fresh copies hidden behind them,
    // so the next loop can swap them in at once, without the canvas fading out.
    function load(fresh){
      var next = !fresh ? frames : frames.map(function(f){
        var n = document.createElement('iframe');
        [].forEach.call(f.attributes, function(a){ if (a.name !== 'src' && a.name !== 'style') n.setAttribute(a.name, a.value); });
        n.style.cssText = 'position:absolute;left:0;top:0;opacity:0';
        f.parentNode.appendChild(n);
        return n;
      });
      return Promise.all(next.map(function(f){
        return new Promise(function(ok){
          var done = function(){
            var w = f.contentWindow;
            if (w && w.protoReady && w.document.fonts) w.document.fonts.ready.then(ok); else setTimeout(done, 60);
          };
          f.onload = done;
          f.src = f.getAttribute('data-src');
        });
      })).then(function(){ return next; });
    }

    function M(id, fr){
      var m = this;
      m.p = (fr || frames).map(function(f){ return { win: f.contentWindow, doc: f.contentDocument }; });
      m.wait = function(ms){ return new Promise(function(ok, no){ setTimeout(function(){ id === run ? ok() : no('stop'); }, reduce ? 0 : ms); }); };
      m.el = function(i, sel){ return typeof sel === 'string' ? m.p[i].doc.querySelector(sel) : sel; };
      // Shows a tap on the element, then clicks it, so the prototype does what it really does.
      m.tap = function(i, sel){
        var el = m.el(i, sel);
        if (!el) { console.warn('no tap target', sel); return m.wait(0); }
        if (!reduce) {
          var ph = m.p[i].doc.getElementById('phone'), a = ph.getBoundingClientRect(), b = el.getBoundingClientRect();
          var t = m.p[i].doc.createElement('div');
          t.className = 'm-tap';
          t.style.left = (b.left + b.width / 2 - a.left) + 'px';
          t.style.top = (b.top + b.height / 2 - a.top) + 'px';
          ph.appendChild(t);
          setTimeout(function(){ t.remove(); }, 700);
        }
        return m.wait(200).then(function(){ el.click(); });
      };
      // Types into a field one letter at a time, firing the input events the prototype listens for.
      m.type = function(i, sel, text, gap){
        var el = m.el(i, sel);
        return text.split('').reduce(function(p, ch){
          return p.then(function(){
            el.value += ch;
            el.dispatchEvent(new m.p[i].win.Event('input', { bubbles: true }));
            return m.wait(gap || 70);
          });
        }, Promise.resolve());
      };
      // Scrolls a phone's page smoothly to put an element near the top.
      m.scrollTo = function(i, sel, offset){
        var el = m.el(i, sel), c = el.closest('.content');
        var top = c.scrollTop + el.getBoundingClientRect().top - c.getBoundingClientRect().top - (offset || 60);
        c.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
        return m.wait(700);
      };
      // Adds CSS inside one phone, to hide demo-only hints the prototype shows testers.
      m.css = function(i, text){
        var s = m.p[i].doc.createElement('style'); s.textContent = text; m.p[i].doc.head.appendChild(s);
        return s;
      };
    }

    // Reduced motion: go straight to the last frame. Without a still(), the timeline runs with no waits.
    function still(id){
      frames.forEach(function(f){ f.contentDocument.body.classList.add('m-still'); });
      var m = new M(id);
      return Promise.resolve(cfg.setup(m)).then(function(){ return (cfg.still || cfg.play)(m); });
    }

    var loaded = false;
    function play(){
      var id = ++run, fresh = loaded;
      if (!fresh) stage.classList.add('out');
      load(fresh).then(function(next){
        if (id !== run) { if (fresh) next.forEach(function(f){ f.remove(); }); return; }
        loaded = true;
        if (reduce) return still(id).then(function(){ stage.classList.remove('out'); });
        var m = new M(id, next);
        next.forEach(function(f){ f.contentDocument.body.classList.add('m-still'); });
        return Promise.resolve(cfg.setup(m))
          .then(function(){ return m.wait(80); })
          .then(function(){
            // swap the fresh phones in where the old ones were
            if (fresh) { frames.forEach(function(f){ f.remove(); }); next.forEach(function(f){ f.style.cssText = ''; }); frames = next; }
            frames.forEach(function(f){ f.contentDocument.body.classList.remove('m-still'); });
            stage.classList.remove('out');
            return m.wait(900);
          })
          .then(function(){ return cfg.play(m); })
          .then(function(){ if (cfg.loop === false || /hold/.test(location.search)) throw 'stop'; return m.wait(2600); })
          .then(play);
      }).catch(function(e){ if (e !== 'stop') console.error(e); });
    }

    // ?still and ?hold (used for captures) start straight away, without waiting to be on screen
    if (/still|hold/.test(location.search)) { play(); return; }
    // Play only while the frame is on screen; start over each time it comes back.
    var on = false;
    new IntersectionObserver(function(es){
      var vis = es[es.length - 1].isIntersecting;
      if (vis && !on) { on = true; play(); }
      else if (!vis && on) { on = false; run++; }
    }, { threshold: 0.2 }).observe(document.body);
  };
})();
