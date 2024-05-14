import Header from "./components/Header";
import PhotoGallery from "./components/PhotoGallery";

function App() {
  return (
    <div className="container mx-auto px-5 py-2 lg:px-32 lg:pt-12 bg-slate-200">
      <Header />
      <PhotoGallery />
    </div>
  );
}

export default App;
