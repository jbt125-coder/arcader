# Bundled EmulatorJS 4.2.3

A local copy of [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) 4.2.3 (GPL-3.0, see `LICENSE`)
so Arcade Loader can run without the EmulatorJS CDN and work offline.

- `loader.js`, `emulator.css`, `src/`, `compression/`, `localization/`, `version.json`: from the
  `@emulatorjs/emulatorjs@4.2.3` npm package, unchanged.
- `emulator.min.js` / `emulator.min.css`: the npm package ships no minified build, so these are just the
  `src/` scripts concatenated in `loader.js` order, and a copy of `emulator.css`.
- `cores/` (except Vircon32, below): the non-threaded WebGL1 ("legacy") builds of fceumm, mame2003, mame2003_plus and fbneo from the
  `@emulatorjs/core-*@4.2.3` npm packages. Those are the only builds the page loads, because it defaults
  WebGL2 off and GitHub Pages can't enable threads.

## Vircon32 core (built here, not from EmulatorJS)

EmulatorJS has no Vircon32 core, so `cores/vircon32-legacy-wasm.data` and `cores/reports/vircon32.json`
were built for this repo with EmulatorJS's own recipe, matched to the builds of the other 4.2.3 cores:

- Core source: [vircon32/vircon32-libretro](https://github.com/vircon32/vircon32-libretro) at `35a4042`
  (BSD-3-Clause, see `LICENSE-vircon32.md`), compiled with Emscripten 3.1.74:
  `emcmake cmake -DLIBRETRO_STATIC=1 -DENABLE_OPENGLES2=1 -DLIBRETRO_SUFFIX=_emscripten`.
- Linked with [EmulatorJS/RetroArch](https://github.com/EmulatorJS/RetroArch) at `6dd4353` (the `next` branch
  as of the 4.2.3 core builds, June 2025) using `emmake ./build-emulatorjs.sh --clean --legacy`.
- Packed like [EmulatorJS/build](https://github.com/EmulatorJS/build) at `b24e5b5` does: `core.json`,
  `license.txt` and `build.json` added to the `.data` 7z archive.

Only the WebGL1 ("legacy") build is kept, because the page turns WebGL2 off.

When updating the version, replace all of this together (rebuilding Vircon32 against the new RetroArch)
and bump `CACHE` in `../sw.js`.
