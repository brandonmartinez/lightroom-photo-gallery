import { useState } from "react";
// https://yet-another-react-lightbox.com/documentation
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function PhotoGallery() {
  const [open, setOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const openSlide = (index) => {
    setSlideIndex(index);
    setOpen(true);
  };

  const images = [];

  for (let i = 0; i < process.env.REACT_APP_IMAGE_COUNT; i++) {
    const baseName = process.env.REACT_APP_IMAGE_PREFIX;
    const extension = process.env.REACT_APP_IMAGE_EXTENSION;
    const thumbnailSuffix = process.env.REACT_APP_IMAGE_THUMBNAIL_SUFFIX;
    const formattedImageNumber = (i + 1)
      .toString()
      .padStart(process.env.REACT_APP_IMAGE_PAD, "0");

    const image = {
      full: `images/${baseName}-${formattedImageNumber}.${extension}`,
      thumbnail: `images/${baseName}-${formattedImageNumber}-${thumbnailSuffix}.${extension}`,
    };
    image.src = image.full;
    image.srcSet = [image.thumbnail, image.full];
    images.push(image);
  }

  return (
    <>
      <div class="container mx-auto px-5 py-2 lg:px-32 lg:pt-12">
        <div class="-m-1 flex flex-wrap md:-m-2">
          {images.map((image, index) => (
            <div class="flex w-1/4 flex-wrap" key={`image-${index}`}>
              <div class="w-full p-1 md:p-2">
                <img
                  alt="gallery"
                  class="block h-full w-full rounded-lg border-white border-4 object-cover object-center cursor-pointer transform transition duration-500 hover:scale-105 justify-center items-center"
                  src={image.thumbnail}
                  onClick={() => openSlide(index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={slideIndex}
        on={{ view: ({ index: currentIndex }) => setSlideIndex(currentIndex) }}
        slides={images}
        plugins={[Thumbnails, Download]}
      />
    </>
  );
}
