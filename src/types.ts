export interface GalleryImage {
  /** Path to full-size image, relative to site root (e.g. `images/foo.jpg`). */
  full: string;
  /** Path to thumbnail image, relative to site root. */
  thumbnail: string;
  /** Optional EXIF-derived width of the full image, in pixels. */
  width?: number;
  /** Optional EXIF-derived height of the full image, in pixels. */
  height?: number;
  /** Optional caption from EXIF (ImageDescription / XPTitle / etc.). */
  caption?: string;
  /** ISO timestamp from EXIF DateTimeOriginal, used for sorting. */
  capturedAt?: string;
}

export interface GalleryManifest {
  generatedAt: string;
  images: GalleryImage[];
}
