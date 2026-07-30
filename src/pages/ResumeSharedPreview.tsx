import { useMemo, useState } from "react";
import { Download, FileWarning, Loader2 } from "lucide-react";
import Bowizzy from "@/assets/bowizzy.png";

/**
 * Public (unauthenticated) viewer for a shared resume.
 *
 * The share link keeps the reader on a Bowizzy URL instead of exposing the
 * raw storage URL:
 *   /resume-shared-preview/q=https://res.cloudinary.com/.../file.pdf
 *
 * The file URL is NOT encoded in the links we generate (so the address bar
 * stays readable), but a percent-encoded one is accepted too — as is the
 * `?q=` query form — so older or hand-built links keep working.
 */

// Only files served from these hosts are embedded. Without this the route
// would happily render any attacker-supplied page under the Bowizzy domain.
const ALLOWED_FILE_HOSTS = ["res.cloudinary.com"];

const ROUTE_PREFIX = "/resume-shared-preview/";

export const buildSharedResumeUrl = (fileUrl: string) =>
  `${window.location.origin}${ROUTE_PREFIX}q=${fileUrl}`;

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Some CDNs and proxies collapse the `//` in the embedded `https://` down to a
 * single slash while normalising the path. Put it back.
 */
const repairProtocolSlashes = (value: string) =>
  value.replace(/^(https?:)\/(?!\/)/i, "$1//");

/**
 * Pulls the file URL out of the current address.
 *
 * Read straight off `window.location` rather than via `useParams`, because the
 * embedded URL carries its own `://` and slashes — going through the router's
 * splat param risks it being normalised or decoded before we see it.
 */
const readFileUrlFromLocation = (): string => {
  const href = window.location.href;
  const markerIndex = href.indexOf(ROUTE_PREFIX);

  if (markerIndex !== -1) {
    const rest = href.slice(markerIndex + ROUTE_PREFIX.length);
    if (rest.startsWith("q=")) {
      return repairProtocolSlashes(safeDecode(rest.slice(2)));
    }
  }

  // Fallback: /resume-shared-preview?q=<encoded url>
  const queryValue = new URLSearchParams(window.location.search).get("q");
  return queryValue ? repairProtocolSlashes(safeDecode(queryValue)) : "";
};

const isAllowedFileUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return ALLOWED_FILE_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
};

export default function ResumeSharedPreview() {
  const fileUrl = useMemo(readFileUrlFromLocation, []);
  const isValid = useMemo(() => isAllowedFileUrl(fileUrl), [fileUrl]);

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Hides the built-in PDF viewer chrome (filename, paging, zoom, download,
  // print). Honoured by the Chromium viewer; Firefox and Safari ignore it.
  const embedUrl = `${fileUrl}#toolbar=0&navpanes=0`;

  /**
   * Fetches the file and saves it from a blob URL.
   *
   * A plain `<a download>` does not work here: the `download` attribute is
   * ignored for cross-origin links, so the browser would navigate to the
   * storage URL and expose it instead of downloading.
   */
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError("");

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Revoking straight away can cancel the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error("Failed to download resume:", error);
      setDownloadError("Download failed. Please try again.");
      setTimeout(() => setDownloadError(""), 4000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    // `h-screen` is the floor; the inline `100svh` wins where supported so
    // mobile browser chrome can't push the viewer off screen. Browsers that
    // don't know `svh` drop the inline value and keep the 100vh from the class.
    <div
      className="h-screen overflow-hidden flex flex-col bg-[#F0F0F0]"
      style={{ height: "100svh" }}
    >
      <header className="shrink-0 flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-gray-200">
        <a href="https://bowizzy.com" target="_blank" rel="noreferrer">
          <img src={Bowizzy} alt="Bowizzy" className="h-7 sm:h-8 w-auto" />
        </a>

        {isValid && (
          <div className="flex items-center gap-2 sm:gap-3">
            {downloadError && (
              <span className="text-xs text-red-500">{downloadError}</span>
            )}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Download resume"
            >
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="hidden sm:inline">
                {downloading ? "Downloading…" : "Download"}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* min-h-0 lets this flex child actually shrink, so the viewer fills
          whatever is left below the header instead of guessing at its height. */}
      <main className="flex-1 min-h-0 p-0 sm:p-6">
        {isValid ? (
          <iframe
            src={embedUrl}
            title="Shared resume"
            className="w-full h-full border-0 bg-white sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-sm"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full gap-3 px-6">
            <span className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <FileWarning size={22} className="text-red-500" />
            </span>
            <h1 className="text-base sm:text-lg font-semibold text-gray-800">
              This resume link isn't valid
            </h1>
            <p className="text-sm text-gray-500 max-w-sm">
              The link may be incomplete or expired. Ask the sender to share it
              again.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
