#!/usr/bin/env node
/**
 * Scans public/images/ and writes public/images.json — a manifest of
 * { full, thumbnail, width, height, caption, capturedAt } entries used by the
 * gallery. EXIF metadata is read via the `exifr` package when available; if
 * the dependency isn't installed yet, the manifest is still written with
 * filename-only entries so the build can succeed.
 *
 * Conventions:
 *  - All images live under public/images/
 *  - Each photo has a full-size file (e.g. foo-00001.jpg) and a thumbnail
 *    that ends in -<thumbSuffix> (default `-thumb`) before the extension.
 *  - The thumbnail suffix is configurable via VITE_THUMBNAIL_SUFFIX.
 */

import { existsSync } from "node:fs";
import {
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const imagesDir = path.join(projectRoot, "public", "images");
const manifestPath = path.join(projectRoot, "public", "images.json");

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const THUMB_SUFFIX = (process.env.VITE_THUMBNAIL_SUFFIX || "thumb").replace(
  /^-/,
  "",
);

async function loadEnv() {
  // Minimal .env loader so VITE_THUMBNAIL_SUFFIX works without requiring dotenv.
  const envPath = path.join(projectRoot, ".env");
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2];
    }
  }
}

async function tryLoadExifr() {
  try {
    const mod = await import("exifr");
    return mod.default ?? mod;
  } catch {
    console.warn(
      "[manifest] exifr not installed; falling back to filename-only manifest.",
    );
    return null;
  }
}

/**
 * Read JPEG/PNG pixel dimensions by scanning the file header. Used as a
 * fallback when EXIF has been stripped (common for Lightroom exports).
 */
async function readPixelDimensions(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  try {
    if (ext === ".png") {
      const fh = await readFile(absPath);
      // PNG IHDR is at byte 16 (width) and 20 (height), big-endian.
      if (fh.length >= 24 && fh.toString("ascii", 1, 4) === "PNG") {
        return { width: fh.readUInt32BE(16), height: fh.readUInt32BE(20) };
      }
      return {};
    }
    if (ext !== ".jpg" && ext !== ".jpeg") return {};
    const buf = await readFile(absPath);
    // Scan for SOF (Start Of Frame) marker.
    let i = 2; // skip SOI (0xFFD8)
    while (i < buf.length) {
      if (buf[i] !== 0xff) return {};
      const marker = buf[i + 1];
      // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC).
      if (
        marker >= 0xc0 && marker <= 0xcf &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      ) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        return { width, height };
      }
      // Skip this segment: 2-byte length follows marker.
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
    return {};
  } catch {
    return {};
  }
}

function isThumbnail(stem, suffix) {
  return stem.endsWith(`-${suffix}`);
}

function thumbnailFor(stem, ext, suffix) {
  return `${stem}-${suffix}${ext}`;
}

async function readExif(exifr, absPath) {
  if (!exifr) return {};
  try {
    const data = await exifr.parse(absPath, {
      // Read core IFDs so width/height/caption fields are available regardless
      // of which block the encoder wrote them in.
      ifd0: true,
      exif: true,
      xmp: true,
      iptc: true,
      pick: [
        "ImageWidth",
        "ImageHeight",
        "ExifImageWidth",
        "ExifImageHeight",
        "PixelXDimension",
        "PixelYDimension",
        "ImageDescription",
        "XPTitle",
        "Title",
        "Caption",
        "Caption-Abstract",
        "description",
        "DateTimeOriginal",
        "CreateDate",
      ],
    });
    if (!data) return {};
    const decodeXP = (val) => {
      // XPTitle is stored as a byte array of UTF-16LE.
      if (!val) return undefined;
      if (typeof val === "string") return val;
      if (Array.isArray(val) || val instanceof Uint8Array) {
        try {
          return new TextDecoder("utf-16le").decode(
            new Uint8Array(val).filter((_, i, a) => !(i === a.length - 1 && a[i] === 0)),
          ).replace(/\0+$/, "").trim() || undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };
    const caption =
      data.ImageDescription?.trim() ||
      data["Caption-Abstract"]?.trim?.() ||
      data.Caption?.trim?.() ||
      data.Title?.trim?.() ||
      data.description?.trim?.() ||
      decodeXP(data.XPTitle);
    const captured =
      data.DateTimeOriginal instanceof Date
        ? data.DateTimeOriginal.toISOString()
        : data.CreateDate instanceof Date
          ? data.CreateDate.toISOString()
          : undefined;
    return {
      width:
        data.ImageWidth ?? data.ExifImageWidth ?? data.PixelXDimension,
      height:
        data.ImageHeight ?? data.ExifImageHeight ?? data.PixelYDimension,
      caption: caption || undefined,
      capturedAt: captured,
    };
  } catch (err) {
    console.warn(`[manifest] EXIF read failed for ${path.basename(absPath)}:`, err.message);
    return {};
  }
}

async function main() {
  await loadEnv();
  if (!existsSync(imagesDir)) {
    console.warn(`[manifest] ${imagesDir} not found; writing empty manifest.`);
    await writeFile(
      manifestPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), images: [] }, null, 2),
    );
    return;
  }

  const exifr = await tryLoadExifr();
  const entries = await readdir(imagesDir);
  const allFiles = new Set(entries);

  const fullImages = entries
    .filter((name) => {
      const ext = path.extname(name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) return false;
      const stem = name.slice(0, -ext.length);
      return !isThumbnail(stem, THUMB_SUFFIX);
    })
    .sort();

  const images = [];
  for (const name of fullImages) {
    const ext = path.extname(name);
    const stem = name.slice(0, -ext.length);
    const thumbName = thumbnailFor(stem, ext, THUMB_SUFFIX);
    if (!allFiles.has(thumbName)) {
      console.warn(
        `[manifest] Skipping ${name} (missing thumbnail ${thumbName}).`,
      );
      continue;
    }
    const meta = await readExif(exifr, path.join(imagesDir, name));
    let width = meta.width;
    let height = meta.height;
    if (!width || !height) {
      const dims = await readPixelDimensions(path.join(imagesDir, name));
      width = width || dims.width;
      height = height || dims.height;
    }
    images.push({
      full: `images/${name}`,
      thumbnail: `images/${thumbName}`,
      ...(width && height ? { width, height } : {}),
      ...(meta.caption ? { caption: meta.caption } : {}),
      ...(meta.capturedAt ? { capturedAt: meta.capturedAt } : {}),
    });
  }

  // Sort: capturedAt first (chronological), then filename for ties / missing.
  images.sort((a, b) => {
    if (a.capturedAt && b.capturedAt) {
      return a.capturedAt.localeCompare(b.capturedAt);
    }
    if (a.capturedAt) return -1;
    if (b.capturedAt) return 1;
    return a.full.localeCompare(b.full);
  });

  await writeFile(
    manifestPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), images },
      null,
      2,
    ) + "\n",
  );
  console.log(`[manifest] Wrote ${images.length} images to ${path.relative(projectRoot, manifestPath)}`);
}

main().catch((err) => {
  console.error("[manifest] Failed:", err);
  process.exit(1);
});
