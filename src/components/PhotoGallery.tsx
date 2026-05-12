import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { useState } from "react";

import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

// Build-time import of the manifest produced by `scripts/generate-manifest.mjs`.
// Baked into the JS bundle — no runtime fetch.
import manifest from "../../public/images.json";
import type {
  GalleryImage,
  GalleryManifest,
} from "../types";

const { images } = manifest as GalleryManifest;

export default function PhotoGallery() {
  const [open, setOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const openSlide = (index: number) => {
    setSlideIndex(index);
    setOpen(true);
  };

  const slides = images.map((image: GalleryImage) => ({
    src: image.full,
    srcSet: [
      { src: image.thumbnail, width: 400, height: 0 },
      { src: image.full, width: image.width ?? 2000, height: image.height ?? 0 },
    ],
    width: image.width,
    height: image.height,
    alt: image.caption,
    description: image.caption,
    title: image.caption,
    download: image.full,
  }));

  return (
    <>
      <div className="py-2 lg:pt-12">
        <div className="gap-2 md:gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.full}
              onClick={() => openSlide(index)}
              className="block border-4 border-white dark:border-slate-700 rounded-lg transition-transform duration-300 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 hover:scale-[1.02]"
              aria-label={image.caption ?? `Open image ${index + 1}`}
            >
              <img
                alt={image.caption ?? `Photo ${index + 1}`}
                src={image.thumbnail}
                width={image.width}
                height={image.height}
                loading="lazy"
                decoding="async"
                className="block w-full h-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={slideIndex}
        on={{ view: ({ index: currentIndex }) => setSlideIndex(currentIndex) }}
        slides={slides}
        plugins={[Thumbnails, Download, Zoom, Fullscreen, Captions]}
      />
    </>
  );
}
