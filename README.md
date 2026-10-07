# CR27 · Panel Workspace

A personal, browser-based tool for metal building panel layout and fabrication. The workflow is **Projects → Walls → Drawing → Openings / Cuts**. No accounts, server database, photos, or native app wrapper.

See [CODE_MAP.md](CODE_MAP.md) to find the code for a specific feature.

## What changed

- Project list with search, duplication, archive/restore and job notes.
- Explicit Sidewall, Gable and Single-slope endwall types. Single slopes use left/right heights and have no ridge input.
- Wall cards, drawing-first workspace, tappable SVG panels/openings, Layout/Openings/Cuts tabs.
- Draft editors, wall templates, panel profile settings, undo/redo and light/dark field themes.
- IndexedDB storage with migration from the old project and single-wall localStorage formats. Old keys remain intact. Another tab cannot silently overwrite a newer database revision.
- Full-project JSON imports/exports and Unicode-compatible project links. Incoming links add jobs; they do not replace existing jobs.
- Consistent offset/panel/rib origins; strict measurement parsing; roofline/panel-stop opening validation.
- Fabrication sheets include all panel stop heights, ridge points, segment angles and opening cut marks from the finished panel edge.
- Text export and print layout. Use the browser's Print/Save PDF action for a PDF.
- Offline shell, local icons, Home Screen manifest and explicit version updates. Online access is needed for the first successful cache installation.

## Run locally

This is a static ES-module application. Serve the repository root with a static HTTP server; opening `index.html` as a `file:` URL will not work reliably. For example:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. Production offline support requires HTTPS (localhost also works). Runtime modules have no third-party dependencies.

## Verification

Use Node.js 24 or newer for the development checks:

```sh
npm ci
npm test
npm run check
```

Tests exercise field calculations, project migration, full-project sharing, reload persistence, database conflict detection, drafts, keyboard events, opening CRUD, undo/redo and stale-output clearing. DOM tests use jsdom and a simulated IndexedDB; they do not substitute for browser/device testing.

After changing runtime files:

```sh
node scripts/update-cache.mjs
npm test
npm run check
```

The generated service worker installs one coherent shell version. A new version waits for the **Save & reload** action. Never edit its file list by hand.

## Project data

Project dimensions stay as editable feet/inches strings; openings store numeric inches. Export JSON is the portable backup. Projects remain on the current browser/device; cloud sync is outside this version.

Migration runs at the **same origin** as the old app. For another host or device, export the old project and import the JSON. Legacy auto-share hashes matching saved walls load their full saved project. Other incoming shares become separate jobs.

A blocked/corrupt store or quota error is visible. Failed saves are never labeled saved. If loading existing data fails, automatic saving is disabled for that session to preserve the original store; temporary edits can still be exported.

Openings may overlap intentionally, with a visible warning. Deleting walls/openings is reversible through session undo. Geometry changes that strand openings retain their data for editing but suppress drawing/cut outputs until corrected.

## Before merging / field use

Check on an actual iPhone: touch targets and keypad, modal scrolling, SVG scrolling, Safari → Home Screen installation, offline reload after a first online visit, cached-version update, JSON import/export, and Print/Save PDF. No live browser or iPhone visual QA was available during this change.

Deployments should retain the existing app origin so migration can read its old storage. The original reports and anchor documents in `Docs/` describe earlier versions; this code map and README describe the current workspace.
