/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GALLERY_NAME?: string;
  readonly VITE_DOWNLOAD_ALL_FILENAME?: string;
  readonly VITE_THUMBNAIL_SUFFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
