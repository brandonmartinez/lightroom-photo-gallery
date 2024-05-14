export default function Header() {
  const galleryName = process.env.REACT_APP_GALLERY_NAME;
  const downloadUrl = process.env.REACT_APP_DOWNLOAD_ALL_FILENAME;
  return (
    <div className="w-full">
      <h1>{galleryName}</h1>
      <p>
        Open your files from… All photos can be downloaded in a zip from{" "}
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          here
        </a>
        .
      </p>
    </div>
  );
}
