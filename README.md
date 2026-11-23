# Faisal Imran: Portfolio

> Build → Break → Learn → Ship.

My personal portfolio. I'm **Faisal Imran**, a Software Engineer and BS Computer Science student at FAST-NUCES (2023 to 2027).
The site is built around an interactive 3D "FI" monogram.

## Stack

- **Next.js (App Router)** · **TypeScript** · **Tailwind CSS v4**
- **Three.js** + **React Three Fiber** + **Drei** for the hero monogram scene
- **Motion for React** for the intro, scroll reveals and layout transitions

No GSAP, smooth-scroll library or UI kit. I kept the dependencies small on purpose.

## Structure

```
src/
  app/                 layout, page, metadata routes (OG image, icon, sitemap, robots, manifest)
  content/site.ts      all the site copy lives here, so edit content in this file only
  components/
    three/             FIScene (WebGL, lazy-loaded) + SVG fallback + HeroVisual wrapper
    sections/          Hero, About, Arsenal, Projects, Experience, Journey, Exploring, Contact
    viz/               per-project technical visualisations
    ui/                Reveal, SplitWords, Magnetic, TiltCard, Button, Motif, …
  lib/                 hooks, intro context, site URL helper
```

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npm run typecheck
```

## Performance & accessibility notes

- The 3D scene is a separate chunk loaded with `next/dynamic({ ssr: false })`, mounted after the intro on idle,
  and its render loop pauses when the hero is off-screen.
- Phones / coarse pointers get a lighter scene (fewer particles, one fewer orbit, no MSAA, lower DPR).
- No WebGL → a static SVG blueprint of the monogram is shown instead.
- `prefers-reduced-motion` → intro skipped, scene rendered still, reveals become simple fades, marquee stops.
- Environment reflections come from local Drei `Lightformer`s, so no HDR files are downloaded.

## Deploy (Vercel)

1. Push this repo to GitHub and import it in Vercel (framework preset: **Next.js**, no overrides needed).
2. Optional: set `NEXT_PUBLIC_SITE_URL` to your custom domain (see `.env.example`).
   Without it, Vercel's production URL is used for canonical/OG links automatically.
3. Deploy. No secrets or server environment variables are required.

Private reference material (e.g. CVs, LinkedIn exports, `*.pdf`) is git-ignored and must not be added to `public/`.
