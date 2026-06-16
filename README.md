# Film Maker Web

A beautiful, installable web reimagining of the **Film Maker** Flutter app — turn
your photos into cinematic memory films, right in the browser.

🔗 **Live:** https://jacky92q.github.io/film-maker-web/

Built with **React + TypeScript + Vite**, fully client‑side. It is a faithful,
animated port of the original Flutter editor (slides, transitions, text, photos,
stickers, ambient effects, filters, frames) plus real in‑browser video export.

## Features

- **Project library** — create, open, duplicate and delete films; everything is
  saved locally (projects in `localStorage`, photos in IndexedDB).
- **Slide editor**
  - Background photo (zoom/pan), solid colour, dim gradients, overlays (vignette,
    grain), decorative frames, animated ambient effects (petals, snow, sparkles,
    gold dust, confetti, bokeh, stars, ribbons, light rays…).
  - **Text layers** — 6 font families with Korean fallbacks, 13 colour presets +
    custom colour, outline, shadow, letter‑spacing, background pill/box, rotation,
    11 content animations (typewriter, shimmer, handwriting, drift‑zoom…).
  - **Photo layers** — shapes (rounded, circle, heart, arch), frames (white, gold,
    polaroid), filters, crop zoom/pan, per‑layer animations.
  - **Stickers** — 68 hand‑cut decorative stickers across 4 categories.
  - **Transitions** — fade, slide, zoom, Ken Burns, blur dissolve, wipes, pushes,
    circle reveal.
  - Direct manipulation on the canvas: drag to move, pinch to scale/rotate.
  - Undo/redo, keyboard shortcuts, slide templates.
- **Preview** — full‑screen real‑time playback with scrubber and slide navigation.
- **Export** — renders the film on a canvas and encodes it with `MediaRecorder`
  (MP4 where supported, otherwise WebM) at 720p / 1080p / 4K. Also exports each
  slide as a PNG.
- **Bilingual** — English & 한국어, auto‑detected and persisted.
- **PWA** — installable on mobile Chrome / desktop, offline‑capable via a service
  worker.

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand ·
vite-plugin-pwa · HTML Canvas 2D for rendering & export.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
```

## Deployment

Pushes to `main` (and the active development branch) trigger
`.github/workflows/deploy.yml`, which builds the site and publishes `dist/` to
GitHub Pages. The Vite `base` is `/film-maker-web/`.

> Enable **Settings → Pages → Build and deployment → Source: GitHub Actions** on
> the repository once, so the workflow can deploy.

## Notes

Authentication is a local‑only mock (there is no backend on GitHub Pages); use
**Continue as guest** or any email to enter. The original app's assets (fonts and
stickers) were ported from the `film-maker` repository.
