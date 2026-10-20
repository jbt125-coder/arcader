/* On-screen controller for Arcade Loader.
   Each console group keeps its own layout (which controls are shown, where, and
   how big), arranged by the player in an editor before playing. During a game
   the same layout is drawn over the emulator and sends presses to EmulatorJS.
   Positions are percentages of the screen, so the editor matches the game. */
(function () {
  /* RetroPad input numbers, as EmulatorJS's simulateInput() takes them */
  var UP = 4, DOWN = 5, LEFT = 6, RIGHT = 7;

  var CONTROLS = [
    { id: 'dpad',   label: 'D-pad',    kind: 'dpad' },
    { id: 'stick',  label: 'Joystick', kind: 'stick' },
    { id: 'a',      label: 'A',        kind: 'round',    input: 8 },
    { id: 'b',      label: 'B',        kind: 'round',    input: 0 },
    { id: 'x',      label: 'X',        kind: 'round',    input: 9 },
    { id: 'y',      label: 'Y',        kind: 'round',    input: 1 },
    { id: 'l',      label: 'L1',       kind: 'shoulder', input: 10 },
    { id: 'r',      label: 'R1',       kind: 'shoulder', input: 11 },
    { id: 'l2',     label: 'L2',       kind: 'shoulder', input: 12 },
    { id: 'r2',     label: 'R2',       kind: 'shoulder', input: 13 },
    { id: 'select', label: 'Select',   kind: 'pill',     input: 2 },
    { id: 'start',  label: 'Start',    kind: 'pill',     input: 3 }
  ];

  /* The three arcade cores share one layout */
  function group(core) { return /^(mame|fbneo)/.test(core) ? 'arcade' : core; }
  var GROUP_NAMES = { arcade: 'Arcade', nes: 'NES', vircon32: 'Vircon32' };
  var LABELS = { arcade: { select: 'Coin' } };
  var ASPECT = { arcade: 4 / 3, nes: 8 / 7, vircon32: 16 / 9 };

  /* Default positions [x%, y%] of each control's centre; missing ones start hidden */
  var DEFAULTS = {
    nes:      { dpad: [14, 66], b: [76, 72], a: [89, 58], select: [42, 90], start: [58, 90] },
    arcade:   { stick: [15, 64], y: [75, 64], x: [84, 46], b: [84, 82], a: [93, 64], select: [42, 90], start: [58, 90] },
    vircon32: { dpad: [14, 66], y: [75, 64], x: [84, 46], b: [84, 82], a: [93, 64], l: [13, 24], r: [86, 24], start: [58, 90] }
  };

  function defaultLayout(g) {
    var d = DEFAULTS[g] || DEFAULTS.nes, items = {};
    CONTROLS.forEach(function (c) {
      var p = d[c.id];
      items[c.id] = { on: !!p, x: p ? p[0] : 50, y: p ? p[1] : 45 };
    });
    return { size: 1, items: items };
  }

  var KEY = 'arcader_pad_';
  function load(core) {
    var g = group(core), lay = defaultLayout(g);
    try {
      var saved = JSON.parse(localStorage.getItem(KEY + g));
      if (saved && saved.items) {
        lay.size = saved.size || 1;
        for (var id in lay.items) { if (saved.items[id]) { lay.items[id] = saved.items[id]; } }
      }
    } catch (e) {}
    return lay;
  }
  function save(core, lay) {
    try { localStorage.setItem(KEY + group(core), JSON.stringify(lay)); } catch (e) {}
  }

  var CSS =
    '.pad-root{position:absolute;z-index:10;pointer-events:none;' +
      'top:env(safe-area-inset-top);bottom:env(safe-area-inset-bottom);' +
      'left:env(safe-area-inset-left);right:env(safe-area-inset-right);}' +
    '.pad-ctl{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;touch-action:none;' +
      '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;' +
      'box-sizing:border-box;display:flex;align-items:center;justify-content:center;' +
      'font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;font-weight:bold;color:#fff;}' +
    '.pad-play .pad-ctl{opacity:.55;}' +
    '.pad-btn{background:rgba(34,18,59,.85);border:2px solid rgba(255,255,255,.75);}' +
    '.pad-btn.on{background:#ff3fa4;border-color:#ff3fa4;}' +
    '.pad-round{width:calc(17vmin*var(--s));height:calc(17vmin*var(--s));border-radius:50%;font-size:calc(7vmin*var(--s));}' +
    '.pad-shoulder{width:calc(19vmin*var(--s));height:calc(10vmin*var(--s));border-radius:calc(4vmin*var(--s));font-size:calc(5vmin*var(--s));}' +
    '.pad-pill{width:calc(20vmin*var(--s));height:calc(8vmin*var(--s));border-radius:calc(4vmin*var(--s));font-size:calc(4vmin*var(--s));font-weight:normal;}' +
    '.pad-dpad,.pad-stick{width:calc(42vmin*var(--s));height:calc(42vmin*var(--s));}' +
    '.pad-dpad .arm{position:absolute;background:rgba(34,18,59,.85);border:2px solid rgba(255,255,255,.75);box-sizing:border-box;}' +
    '.pad-dpad .up,.pad-dpad .down{left:33.3%;width:33.4%;height:36%;}' +
    '.pad-dpad .left,.pad-dpad .right{top:33.3%;height:33.4%;width:36%;}' +
    '.pad-dpad .up{top:0;border-radius:18% 18% 0 0;border-bottom:0;}' +
    '.pad-dpad .down{bottom:0;border-radius:0 0 18% 18%;border-top:0;}' +
    '.pad-dpad .left{left:0;border-radius:18% 0 0 18%;border-right:0;}' +
    '.pad-dpad .right{right:0;border-radius:0 18% 18% 0;border-left:0;}' +
    '.pad-dpad .mid{position:absolute;left:33.3%;top:33.3%;width:33.4%;height:33.4%;background:rgba(34,18,59,.85);}' +
    '.pad-dpad.up .up,.pad-dpad.down .down,.pad-dpad.left .left,.pad-dpad.right .right{background:#ff3fa4;border-color:#ff3fa4;}' +
    '.pad-stick{border-radius:50%;background:rgba(34,18,59,.6);border:2px solid rgba(255,255,255,.6);}' +
    '.pad-knob{position:absolute;left:30%;top:30%;width:40%;height:40%;border-radius:50%;' +
      'background:rgba(255,63,164,.85);border:2px solid #fff;box-sizing:border-box;pointer-events:none;}' +
    '.pad-edit .pad-ctl{cursor:move;}' +
    '.pad-edit .pad-ctl.drag{outline:2px dashed #ffe45c;outline-offset:4px;}' +
    '#padEditor{position:fixed;inset:0;z-index:100000;background:#000;color:#f2e9ff;' +
      'font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;-webkit-user-select:none;user-select:none;}' +
    '#padEditor .screen{position:absolute;top:50%;left:50%;height:100%;max-width:100%;transform:translate(-50%,-50%);' +
      'border:2px dashed #4b2d7a;box-sizing:border-box;background:#0b0614;display:flex;align-items:center;justify-content:center;' +
      'color:#4b2d7a;font-size:14px;text-align:center;}' +
    '#padEditor .bar{position:absolute;z-index:20;top:calc(env(safe-area-inset-top) + 8px);left:50%;transform:translateX(-50%);' +
      'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;max-width:92%;' +
      'background:rgba(34,18,59,.92);border:2px solid #4b2d7a;border-radius:12px;padding:6px 8px;}' +
    '#padEditor .bar b{font-size:14px;color:#ffe45c;margin:0 4px;}' +
    '#padEditor button{font-size:14px;font-weight:bold;padding:7px 11px;border-radius:9px;border:2px solid #ff3fa4;' +
      'background:#22123b;color:#f2e9ff;-webkit-tap-highlight-color:transparent;}' +
    '#padEditor button.done{background:#ffe45c;border-color:#ffe45c;color:#140a24;}' +
    '#padEditor .hint{position:absolute;z-index:20;bottom:calc(env(safe-area-inset-bottom) + 6px);left:50%;transform:translateX(-50%);' +
      'font-size:12px;color:#b9a6d9;white-space:nowrap;pointer-events:none;}' +
    '#padEditor .sheet{position:absolute;z-index:30;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:#22123b;border:2px solid #ff3fa4;border-radius:14px;padding:12px 14px;max-height:86%;overflow:auto;' +
      'display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;min-width:240px;}' +
    '#padEditor .sheet h3{grid-column:1/-1;margin:0 0 4px;font-size:16px;color:#ffe45c;}' +
    '#padEditor .sheet label{display:flex;align-items:center;gap:8px;font-size:15px;padding:4px 0;}' +
    '#padEditor .sheet input{width:22px;height:22px;accent-color:#ff3fa4;}' +
    '#padEditor .sheet button{grid-column:1/-1;margin-top:6px;}';

  function addStyle() {
    if (document.getElementById('padStyle')) { return; }
    var st = document.createElement('style');
    st.id = 'padStyle';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function label(g, c) { return (LABELS[g] && LABELS[g][c.id]) || c.label; }

  /* Draw the enabled controls of a layout into root; returns the elements by id */
  function draw(root, core, lay) {
    var g = group(core), els = {};
    root.innerHTML = '';
    root.style.setProperty('--s', lay.size);
    CONTROLS.forEach(function (c) {
      var it = lay.items[c.id];
      if (!it || !it.on) { return; }
      var el = document.createElement('div');
      el.className = 'pad-ctl pad-' + c.kind + (c.input !== undefined ? ' pad-btn' : '');
      if (c.kind === 'dpad') {
        el.innerHTML = '<div class="arm up"></div><div class="arm down"></div>' +
          '<div class="arm left"></div><div class="arm right"></div><div class="mid"></div>';
      } else if (c.kind === 'stick') {
        el.innerHTML = '<div class="pad-knob"></div>';
      } else {
        el.textContent = label(g, c);
      }
      el.style.left = it.x + '%';
      el.style.top = it.y + '%';
      root.appendChild(el);
      els[c.id] = el;
    });
    return els;
  }

  /* Keep our touches away from EmulatorJS, whose parent listeners would
     otherwise treat them as taps on the game (closing its menu bar etc.) */
  function isolate(el) {
    ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'mousedown', 'mouseup', 'click'].forEach(function (t) {
      el.addEventListener(t, function (e) { e.stopPropagation(); });
    });
  }

  function capture(el, e) { try { el.setPointerCapture(e.pointerId); } catch (err) {} }

  function bindButton(el, input, send) {
    var down = 0, id = null;
    function press(v) {
      if (v === down) { return; }
      down = v;
      el.classList.toggle('on', !!v);
      send(input, v);
    }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      id = e.pointerId;
      capture(el, e);
      press(1);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
      el.addEventListener(t, function (e) { if (e.pointerId === id) { id = null; press(0); } });
    });
  }

  /* D-pad and joystick both send the four digital directions, 8-way */
  function bindDirections(el, send) {
    var state = {}, id = null, knob = el.querySelector('.pad-knob');
    var DIRS = [['up', UP], ['down', DOWN], ['left', LEFT], ['right', RIGHT]];
    function set(on) {
      DIRS.forEach(function (d) {
        var v = on[d[0]] ? 1 : 0;
        if ((state[d[0]] || 0) === v) { return; }
        state[d[0]] = v;
        el.classList.toggle(d[0], !!v);
        send(d[1], v);
      });
    }
    function track(e) {
      var r = el.getBoundingClientRect(), half = r.width / 2;
      var dx = e.clientX - (r.left + half), dy = e.clientY - (r.top + half);
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (knob) {
        var k = Math.min(dist, half * 0.6) / (dist || 1);
        knob.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
      }
      if (dist < half * (knob ? 0.25 : 0.18)) { set({}); return; }
      var a = Math.atan2(dy, dx) * 180 / Math.PI;
      set({
        right: Math.abs(a) < 67.5,
        left: Math.abs(a) > 112.5,
        down: a > 22.5 && a < 157.5,
        up: a < -22.5 && a > -157.5
      });
    }
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      id = e.pointerId;
      capture(el, e);
      track(e);
    });
    el.addEventListener('pointermove', function (e) { if (e.pointerId === id) { track(e); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
      el.addEventListener(t, function (e) {
        if (e.pointerId !== id) { return; }
        id = null;
        if (knob) { knob.style.transform = ''; }
        set({});
      });
    });
  }

  /* Bluetooth controllers are read by EmulatorJS itself. We only hide the
     on-screen controls while one is in use (touching the screen brings them
     back) and let its left stick work as a D-pad, which NES and Vircon32
     games expect; EmulatorJS sends the stick as analog, which they ignore. */
  function watchControllers(root, send) {
    if (!navigator.getGamepads) { return; }
    var stick = {};
    var DIRS = [['up', UP], ['down', DOWN], ['left', LEFT], ['right', RIGHT]];
    function frame() {
      var pads = navigator.getGamepads(), gp = null;
      for (var i = 0; i < pads.length; i++) { if (pads[i]) { gp = pads[i]; break; } }
      if (gp) {
        var used = gp.buttons.some(function (b) { return b.pressed; }) ||
          gp.axes.some(function (a) { return Math.abs(a) > 0.5; });
        if (used) { root.style.display = 'none'; }
        var x = gp.axes[0] || 0, y = gp.axes[1] || 0;
        var on = { left: x < -0.5, right: x > 0.5, up: y < -0.5, down: y > 0.5 };
        DIRS.forEach(function (d) {
          var v = on[d[0]] ? 1 : 0;
          if ((stick[d[0]] || 0) === v) { return; }
          stick[d[0]] = v;
          send(d[1], v);
        });
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.addEventListener('touchstart', function () { root.style.display = ''; }, true);
  }

  /* Draw the saved layout for core over a running game; send(input, value) presses it */
  function mount(container, core, send) {
    addStyle();
    var root = document.createElement('div');
    root.className = 'pad-root pad-play';
    container.appendChild(root);
    var els = draw(root, core, load(core));
    CONTROLS.forEach(function (c) {
      var el = els[c.id];
      if (!el) { return; }
      isolate(el);
      if (c.input !== undefined) { bindButton(el, c.input, send); } else { bindDirections(el, send); }
    });
    watchControllers(root, send);
    return root;
  }

  /* Full-screen editor for core's layout; onClose runs after Done */
  function edit(core, onClose) {
    addStyle();
    var g = group(core), lay = load(core);
    var ed = document.createElement('div');
    ed.id = 'padEditor';
    ed.innerHTML =
      '<div class="screen">Game picture</div>' +
      '<div class="pad-root pad-edit"></div>' +
      '<div class="bar"><b>' + (GROUP_NAMES[g] || g) + ' controller</b>' +
        '<button data-act="buttons">Buttons</button>' +
        '<button data-act="smaller">Size &minus;</button><button data-act="bigger">Size +</button>' +
        '<button data-act="reset">Reset</button><button data-act="done" class="done">Done</button></div>' +
      '<div class="hint">Drag the controls to move them. Hold the phone the way you play.</div>';
    document.body.appendChild(ed);
    var root = ed.querySelector('.pad-root'), screen = ed.querySelector('.screen');
    screen.style.aspectRatio = String(ASPECT[g] || 4 / 3);

    function redraw() {
      var els = draw(root, core, lay);
      Object.keys(els).forEach(function (id) { bindDrag(els[id], lay.items[id]); });
    }
    function bindDrag(el, it) {
      var id = null;
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        id = e.pointerId;
        capture(el, e);
        el.classList.add('drag');
      });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerId !== id) { return; }
        var r = root.getBoundingClientRect();
        it.x = Math.round(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)) * 10) / 10;
        it.y = Math.round(Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) * 10) / 10;
        el.style.left = it.x + '%';
        el.style.top = it.y + '%';
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
        el.addEventListener(t, function (e) {
          if (e.pointerId !== id) { return; }
          id = null;
          el.classList.remove('drag');
          save(core, lay);
        });
      });
    }
    function sheet() {
      var s = document.createElement('div');
      s.className = 'sheet';
      s.innerHTML = '<h3>Show these controls</h3>';
      CONTROLS.forEach(function (c) {
        var l = document.createElement('label'), box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = lay.items[c.id].on;
        box.onchange = function () {
          lay.items[c.id].on = box.checked;
          save(core, lay);
          redraw();
        };
        l.appendChild(box);
        l.appendChild(document.createTextNode(label(g, c)));
        s.appendChild(l);
      });
      var close = document.createElement('button');
      close.textContent = 'Close';
      close.onclick = function () { s.remove(); };
      s.appendChild(close);
      ed.appendChild(s);
    }
    ed.querySelector('.bar').onclick = function (e) {
      var act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'buttons') {
        if (!ed.querySelector('.sheet')) { sheet(); }
      } else if (act === 'smaller' || act === 'bigger') {
        lay.size = Math.round(Math.max(0.6, Math.min(1.6, lay.size + (act === 'bigger' ? 0.1 : -0.1))) * 10) / 10;
        save(core, lay);
        root.style.setProperty('--s', lay.size);
      } else if (act === 'reset') {
        lay = defaultLayout(g);
        try { localStorage.removeItem(KEY + g); } catch (err) {}
        var open = ed.querySelector('.sheet');
        if (open) { open.remove(); }
        redraw();
      } else if (act === 'done') {
        ed.remove();
        if (onClose) { onClose(); }
      }
    };
    redraw();
  }

  window.ArcaderPad = { mount: mount, edit: edit, groupName: function (core) { return GROUP_NAMES[group(core)]; } };
})();
