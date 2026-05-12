import Header from "./components/Header";
import PhotoGallery from "./components/PhotoGallery";

export default function App() {
  return (
    <div className="mx-auto px-5 lg:px-32 py-2 lg:pt-12 container">
      <Header />
      <PhotoGallery />
    </div>
  );
}
