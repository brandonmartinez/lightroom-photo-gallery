export default function Header() {
  const galleryName = process.env.REACT_APP_GALLERY_NAME;
  const downloadUrl = 'images/' + process.env.REACT_APP_DOWNLOAD_ALL_FILENAME;
  return (
    <div className="w-full prose max-w-none">
      <img src="logo.png" alt="logo" className="h-10" />
      <h1>{galleryName}</h1>
      <p>
        Select a photo to open the gallery viewer. Photos can be saved from the
        viewer using the download button in the top-right corner. All photos
        from this gallery can be downloaded in a zip from{" "}
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          here
        </a>
        .
      </p>
    </div>
  );
}
