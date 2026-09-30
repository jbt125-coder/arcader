/* Saves Arcade Loader and the bundled emulator on the device so it works offline.
   Bump CACHE whenever anything in PRECACHE changes, so phones pick up the new files. */
var CACHE = 'arcader-v1-ejs-4.2.3';

var PRECACHE = [
  "./",
  "index.html",
  "emulator/compression/extract7z.js",
  "emulator/compression/extractzip.js",
  "emulator/compression/libunrar.js",
  "emulator/compression/libunrar.wasm",
  "emulator/cores/fbneo-legacy-wasm.data",
  "emulator/cores/fceumm-legacy-wasm.data",
  "emulator/cores/mame2003-legacy-wasm.data",
  "emulator/cores/mame2003_plus-legacy-wasm.data",
  "emulator/cores/reports/fbneo.json",
  "emulator/cores/reports/fceumm.json",
  "emulator/cores/reports/mame2003.json",
  "emulator/cores/reports/mame2003_plus.json",
  "emulator/emulator.css",
  "emulator/emulator.min.css",
  "emulator/emulator.min.js",
  "emulator/loader.js",
  "emulator/localization/af-FR.json",
  "emulator/localization/ar-AR.json",
  "emulator/localization/ben-BEN.json",
  "emulator/localization/de-GER.json",
  "emulator/localization/el-GR.json",
  "emulator/localization/en-US.json",
  "emulator/localization/es-ES.json",
  "emulator/localization/fa-AF.json",
  "emulator/localization/hi-HI.json",
  "emulator/localization/it-IT.json",
  "emulator/localization/ja-JA.json",
  "emulator/localization/jv-JV.json",
  "emulator/localization/ko-KO.json",
  "emulator/localization/pt-BR.json",
  "emulator/localization/retroarch.json",
  "emulator/localization/ro-RO.json",
  "emulator/localization/ru-RU.json",
  "emulator/localization/tr-TR.json",
  "emulator/localization/vi-VN.json",
  "emulator/localization/zh-CN.json",
  "emulator/src/GameManager.js",
  "emulator/src/compression.js",
  "emulator/src/emulator.js",
  "emulator/src/gamepad.js",
  "emulator/src/nipplejs.js",
  "emulator/src/shaders.js",
  "emulator/src/socket.io.min.js",
  "emulator/src/storage.js",
  "emulator/version.json"
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE) { return caches.delete(key); }
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) { return; }

  /* The page itself: show the saved copy right away, and refresh it in the
     background when online so the next launch gets any update. */
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (saved) {
        var fresh = fetch(req).then(function (res) {
          if (res.ok) { cache.put(req, res.clone()); }
          return res;
        });
        if (saved) { fresh.catch(function () {}); return saved; }
        return fresh;
      });
    }));
    return;
  }

  /* Everything else: saved copy first, otherwise fetch and save it. */
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req).then(function (saved) {
      return saved || fetch(req).then(function (res) {
        if (res.ok) { cache.put(req, res.clone()); }
        return res;
      });
    });
  }));
});
