import {
  useEffect,
  useState,
} from "react";

const GALLERY_NAME = import.meta.env.VITE_GALLERY_NAME ?? "Photo Gallery";
const DOWNLOAD_ALL_FILENAME =
  import.meta.env.VITE_DOWNLOAD_ALL_FILENAME ?? "download.zip";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  return "light";
}

export default function Header() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const downloadUrl = `images/${DOWNLOAD_ALL_FILENAME}`;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore (e.g. private mode)
    }
    // Keep page title in sync with the gallery name on first mount.
    document.title = GALLERY_NAME;
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <header className="w-full max-w-none dark:prose-invert prose">
      <div className="flex justify-between items-center mb-4 not-prose">
        <img
          src="logo.png"
          alt="Logo"
          className="dark:hidden h-10"
        />
        <img
          src="logo-dark.png"
          alt="Logo"
          className="dark:block hidden h-10"
        />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 border border-slate-400 dark:border-slate-600 rounded-md font-medium text-slate-700 text-sm dark:text-slate-200 transition-colors"
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </div>
      <h1>{GALLERY_NAME}</h1>
      <p>
        Select a photo to open the gallery viewer. Photos can be saved from the
        viewer using the download button in the top-right corner. All photos
        from this gallery can be downloaded in a zip from{" "}
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          here
        </a>
        .
      </p>
    </header>
  );
}
