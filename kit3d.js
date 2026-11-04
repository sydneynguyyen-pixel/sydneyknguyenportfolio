/* kit3d.js — a simplified, interactive model of the Shoal kit, built in three.js.
   Usage: <div class="kit3d" id="kit3d"><img class="k3-poster" ...></div> plus optional
   [data-kit=night] and [data-kit=apart] buttons with aria-pressed.
   Drag to turn the kit, tap a stone to change its glow. The poster stays when WebGL or the
   library is unavailable. Rendering only runs while the stage is on screen. */
(function () {
  var el = document.getElementById('kit3d');
  if (!el || !('IntersectionObserver' in window)) return;
  var LIB = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started = false;

  new IntersectionObserver(function (es, io) {
    if (!es[0].isIntersecting || started) return;
    started = true; io.disconnect();
    import(LIB).then(build).catch(function () { el.classList.add('k3-failed'); });
  }, { rootMargin: '300px 0px' }).observe(el);

  function build(THREE) {
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { el.classList.add('k3-failed'); return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(26, 1, .1, 100);
    var kit = new THREE.Group(); scene.add(kit);

    var hemi = new THREE.HemisphereLight(0xffffff, 0xd9dde3, 1.5); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 7, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 6;
    var sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 4; sc.bottom = -4;
    scene.add(sun);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    // soft glow sprite, shared by every lit stone
    var gc = document.createElement('canvas'); gc.width = gc.height = 128;
    var g = gc.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.35, 'rgba(255,255,255,.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(gc);

    var cream = new THREE.MeshStandardMaterial({ color: 0xefe9d6, roughness: .8 });
    var white = new THREE.MeshStandardMaterial({ color: 0xfbfbfa, roughness: .6 });
    var plate = new THREE.MeshStandardMaterial({ color: 0xe3e7ec, roughness: .7 });
    var glass = new THREE.MeshStandardMaterial({ color: 0xf4f8fc, roughness: .08, metalness: 0, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide });
    var edge = new THREE.LineBasicMaterial({ color: 0xb9c3cf, transparent: true, opacity: .55 });
    var lidMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4, transparent: true, opacity: .62 });

    var STATES = [
      { c: 0xf2f2f0, e: 0x000000, ei: 0, glow: 0 },          // no glow: unassigned or done
      { c: 0xdff3ff, e: 0x82daff, ei: .9, glow: 0x82daff },  // blue: someone has claimed it
      { c: 0xfff1c4, e: 0xffcf5a, ei: .9, glow: 0xffd36b }   // yellow: time is running out
    ];
    var stones = [], jars = [], lids = [], rings = [];
    var stoneGeo = new THREE.SphereGeometry(.14, 28, 18);
    var JW = 1, JH = 1.12, GAP = 1.1;
    // stones per jar, each [state, recurring]
    var LOAD = [
      [[1], [1], [0, 1], [2], [0], [1], [0]],
      [[1], [0], [0, 1]],
      [[1], [2], [1], [0], [0, 1], [1], [0], [1]],
      [[0], [1]],
      [[1], [1], [0], [0, 1], [2]]
    ];
    var x0 = -(LOAD.length - 1) * GAP / 2 - .35;

    function stone(state, recurring) {
      var m = new THREE.MeshStandardMaterial({ roughness: .55 });
      var s = new THREE.Mesh(stoneGeo, m);
      s.scale.set(1, .6, .78); s.rotation.y = Math.random() * Math.PI;
      s.castShadow = true;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.set(.75, .75, 1); s.add(sp);
      s.userData = { state: state, base: state, recurring: recurring, sprite: sp };
      paint(s); stones.push(s);
      return s;
    }
    function paint(s) {
      var st = STATES[s.userData.state], m = s.material;
      m.color.setHex(s.userData.recurring && !st.glow ? 0x9aa9b8 : st.c);
      m.emissive.setHex(st.e); m.emissiveIntensity = st.ei * (night ? 1.4 : 1);
      s.userData.sprite.visible = !!st.glow;
      if (st.glow) { s.userData.sprite.material.color.setHex(st.glow); s.userData.sprite.material.opacity = night ? .95 : .55; }
    }

    LOAD.forEach(function (load, j) {
      var x = x0 + j * GAP, jar = new THREE.Group();
      jar.position.x = x; kit.add(jar);
      var base = new THREE.Mesh(new THREE.BoxGeometry(GAP - .02, .12, 1.08), cream);
      base.position.y = .06; base.castShadow = base.receiveShadow = true; jar.add(base);
      [-.32, .32].forEach(function (dx) {   // the magnets between segments
        var dot = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .01, 16), new THREE.MeshStandardMaterial({ color: 0x8c8f94 }));
        dot.position.set(dx, .125, .44); jar.add(dot);
      });

      var body = new THREE.Group(); body.position.y = .12; jar.add(body); jars.push(body);
      var box = new THREE.BoxGeometry(JW, JH, JW);
      var shell = new THREE.Mesh(box, glass); shell.position.y = JH / 2; shell.renderOrder = 2; body.add(shell);
      var lines = new THREE.LineSegments(new THREE.EdgesGeometry(box), edge); lines.position.y = JH / 2; body.add(lines);

      var ring = new THREE.Mesh(new THREE.BoxGeometry(JW - .1, .08, JW - .1), plate);
      ring.position.y = .2; ring.castShadow = ring.receiveShadow = true; body.add(ring); rings.push(ring);

      load.forEach(function (d, i) {
        var s = stone(d[0], !!d[1]);
        var col = i % 3, row = Math.floor(i / 3);
        s.position.set(-.29 + col * .29 + (row % 2) * .1 + (Math.random() - .5) * .04, .33 + row * .07, -.26 + row * .26 + (Math.random() - .5) * .05);
        body.add(s);
      });

      var lid = new THREE.Group(); lid.position.y = JH + .02; body.add(lid); lids.push(lid);
      var top = new THREE.Mesh(new THREE.BoxGeometry(JW + .02, .05, JW + .02), lidMat); lid.add(top);
      var label = new THREE.Mesh(new THREE.BoxGeometry(.5, .012, .12), white); label.position.set(0, .03, -.3); lid.add(label);
    });

    // charging end: the side pool with spare stones and the glow button
    var pool = new THREE.Group(); pool.position.x = x0 + (LOAD.length - 1) * GAP + GAP / 2 + .52; kit.add(pool);
    var dish = new THREE.Mesh(new THREE.CylinderGeometry(.52, .55, .12, 48), cream);
    dish.position.y = .06; dish.castShadow = dish.receiveShadow = true; pool.add(dish);
    var btn = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .02, 24), new THREE.MeshStandardMaterial({ color: 0x418ef3, emissive: 0x418ef3, emissiveIntensity: .4 }));
    btn.position.set(0, .13, .36); pool.add(btn);
    [[-.15, -.06], [.14, -.1], [0, .14]].forEach(function (p) {
      var s = stone(0, false); s.position.set(p[0], .2, p[1]); pool.add(s);
    });

    // camera orbit: drag turns the kit, vertical drag tilts the view
    var az = -.42, el0 = .36, auto = !reduce, night = false, apart = 0, apartT = 0;
    var drag = null, moved = 0, hover = null, dist = 9.2;
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2();

    function size() {
      var w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dist = Math.max(9.2, 7.6 / (2 * Math.tan(13 * Math.PI / 180) * camera.aspect)); // keep the whole kit in frame
    }
    function place() {
      var r = dist;
      camera.position.set(0, .75 + Math.sin(el0) * r, Math.cos(el0) * r);
      camera.lookAt(0, .5, 0);
      kit.rotation.y = az;
    }
    function hit(e) {
      var b = renderer.domElement.getBoundingClientRect();
      ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
      ray.setFromCamera(ptr, camera);
      var h = ray.intersectObjects(stones, false)[0];
      return h && h.object;
    }
    var cv = renderer.domElement;
    cv.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY }; moved = 0; auto = false;
      el.classList.add('drag'); try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drag) {
        var s = e.pointerType === 'mouse' ? hit(e) : null;
        if (s !== hover) { hover = s; el.classList.toggle('over', !!s); }
        return;
      }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      az += dx * .008; el0 = Math.max(.12, Math.min(1.05, el0 + dy * .005));
      drag = { x: e.clientX, y: e.clientY };
    });
    function up(e) {
      if (drag && moved < 6) {
        var s = hit(e);
        if (s) { s.userData.state = s.userData.base = (s.userData.state + 1) % STATES.length; s.userData.blink = false; paint(s); el.dispatchEvent(new CustomEvent('stone', { detail: s.userData.state })); }
      }
      drag = null; el.classList.remove('drag');
    }
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', function () { drag = null; el.classList.remove('drag'); });

    var stage = el.closest('.kit-sb') || el;
    [].forEach.call(stage.querySelectorAll('[data-kit]'), function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (b.dataset.kit === 'night') {
          night = on; stage.classList.toggle('night', on);
          hemi.intensity = on ? .35 : 1.5; sun.intensity = on ? .25 : 1.6;
          ground.material.opacity = on ? .25 : .1;
          stones.forEach(paint);
        } else apart = on ? 1 : 0;
      });
    });

    // the app's setup video drives the kit: 'off' (no glow), 'pair' (one stone lit), 'find' (it blinks), 'live' (every stone's own glow)
    var mode = 'live', paired = stones[stones.length - 3];
    el._kit = {
      mode: function (m) {
        if (m === mode) return;
        mode = m;
        stones.forEach(function (s) { s.userData.blink = false; s.userData.state = m === 'live' ? s.userData.base : 0; paint(s); });
        if (m === 'pair' || m === 'find') { paired.userData.state = 1; paired.userData.blink = m === 'find'; paint(paired); }
      }
    };
    el.dispatchEvent(new CustomEvent('kitready'));

    var vis = true;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: .05 }).observe(el);
    window.addEventListener('resize', size);
    size(); place();
    el.classList.add('is-live');

    var t0 = performance.now();
    (function frame(t) {
      requestAnimationFrame(frame);
      if (!vis) return;
      var dt = Math.min(50, t - t0) / 1000; t0 = t;
      if (auto && !drag) az += dt * .22;
      apartT += (apart - apartT) * Math.min(1, dt * (reduce ? 60 : 5));
      jars.forEach(function (b, i) { b.position.y = .12 + apartT * .35; lids[i].position.y = JH + .02 + apartT * .55; rings[i].position.y = .2 + apartT * .12; });
      var pulse = .5 + Math.sin(t / 700) * .5;
      var on = Math.sin(t / 160) > 0;
      stones.forEach(function (s) {
        if (s.userData.blink) { s.userData.sprite.visible = on; s.material.emissiveIntensity = on ? .9 : 0; }
        if (s.userData.sprite.visible) { var k = (night ? .85 : .7) + pulse * .1; s.userData.sprite.scale.set(k, k, 1); }
      });
      place();
      renderer.render(scene, camera);
    })(t0);
  }
})();
