# Bundled EmulatorJS 4.2.3

A local copy of [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) 4.2.3 (GPL-3.0, see `LICENSE`)
so Arcade Loader can run without the EmulatorJS CDN and work offline.

- `loader.js`, `emulator.css`, `src/`, `compression/`, `localization/`, `version.json`: from the
  `@emulatorjs/emulatorjs@4.2.3` npm package, unchanged.
- `emulator.min.js` / `emulator.min.css`: the npm package ships no minified build, so these are just the
  `src/` scripts concatenated in `loader.js` order, and a copy of `emulator.css`.
- `cores/`: the non-threaded WebGL1 ("legacy") builds of fceumm, mame2003, mame2003_plus and fbneo from the
  `@emulatorjs/core-*@4.2.3` npm packages. Those are the only builds the page loads, because it defaults
  WebGL2 off and GitHub Pages can't enable threads.

When updating the version, replace all of this together and bump `CACHE` in `../sw.js`.
