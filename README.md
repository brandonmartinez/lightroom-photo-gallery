# lightroom-photo-gallery

A lightweight static photo gallery for sharing Lightroom Classic exports with
photography clients. Built with [Vite](https://vitejs.dev/),
[React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/),
[Tailwind CSS v4](https://tailwindcss.com/), and
[yet-another-react-lightbox](https://yet-another-react-lightbox.com/).

Each gallery is deployed as a separate static site to an Azure Storage Account
(static-website hosting) fronted by Azure Front Door.

## Features

- Build-time **image manifest** — drop photos into `public/images/`, run the
  build, and they're bundled in. No more manual `IMAGE_COUNT`/padding config.
- Reads JPEG/PNG pixel dimensions (and EXIF captions when present) to render
  the grid without layout shift.
- Responsive grid (1 / 2 / 3 / 4 columns), lazy-loaded thumbnails, accessible
  keyboard navigation.
- Lightbox with thumbnails, zoom, fullscreen, download, and captions plugins.
- Dark mode toggle, persisted to `localStorage`, defaults to system preference.

## Prerequisites

- Node.js 20 LTS or newer (see [.nvmrc](.nvmrc))

## Lightroom export workflow

Export from Lightroom Classic into `public/images/` using two presets so that
each photo has a full-size file and a `-thumb` companion:

1. **Full-size export**
   - File naming template: `martinezmedia-{date}-{sequence number (5 digits)}`
     (or any naming you like — only consistency matters)
   - Output: `public/images/<name>-00001.jpg`, `<name>-00002.jpg`, …
2. **Thumbnail export**
   - Same naming template plus a custom suffix `-thumb`
   - Recommended size: ~1000 px on the long edge, quality ~70
   - Output: `public/images/<name>-00001-thumb.jpg`, …

If you use a different thumbnail suffix, set `VITE_THUMBNAIL_SUFFIX` in `.env`
(default is `thumb`).

If you also want a "download all" zip, drop it at
`public/images/<VITE_DOWNLOAD_ALL_FILENAME>` (default `download.zip`).

## Local development

```sh
cp .env.sample .env        # then fill in VITE_GALLERY_NAME, etc.
npm install
npm run dev                # http://localhost:5173, manifest regenerated on start
```

The `predev` / `prebuild` hooks regenerate `public/images.json` automatically.
You can also regenerate manually with `npm run manifest`.

## Build

```sh
npm run build              # type-check + Vite build -> dist/
npm run preview            # serve dist/ locally to verify before deploy
```

`base` is set to `./` in [vite.config.ts](vite.config.ts) so the build works
at any path (root of a Storage Account `$web` container, behind Front Door,
or in a subfolder).

## Deploy to Azure

The repo doesn't include a CI/CD pipeline — galleries are deployed manually:

```sh
# Upload the build to the $web container (static website).
az storage blob upload-batch \
  --account-name <storage-account> \
  --destination '$web' \
  --source dist \
  --overwrite

# Optional: purge Front Door if changes need to go live immediately.
az afd endpoint purge \
  --resource-group <rg> \
  --profile-name <front-door-profile> \
  --endpoint-name <endpoint> \
  --content-paths '/*'
```

## Configuration reference

| Variable                     | Purpose                                                 | Default         |
| ---------------------------- | ------------------------------------------------------- | --------------- |
| `VITE_GALLERY_NAME`          | Title shown in the header and `<title>` tag.            | `Photo Gallery` |
| `VITE_DOWNLOAD_ALL_FILENAME` | Filename of the "download all" zip in `public/images/`. | `download.zip`  |
| `VITE_THUMBNAIL_SUFFIX`      | Suffix that identifies thumbnails (`foo-<suffix>.jpg`). | `thumb`         |

## Project layout

```
index.html                  # Vite entry HTML
src/
  main.tsx                  # React root
  App.tsx
  components/
    Header.tsx              # title + dark mode toggle
    PhotoGallery.tsx        # grid + lightbox; imports images.json at build time
  styles/index.css          # Tailwind v4 entry
  types.ts                  # GalleryImage / GalleryManifest types
scripts/
  generate-manifest.mjs     # scans public/images/, writes public/images.json
public/
  images/                   # photos (gitignored; only .gitkeep is tracked)
  images.json               # generated manifest (gitignored)
  logo.png
  robots.txt
```
