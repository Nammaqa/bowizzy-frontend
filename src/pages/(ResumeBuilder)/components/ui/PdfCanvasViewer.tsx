import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PdfCanvasViewerProps {
  blob: Blob | null;
  className?: string;
}

// Renders every page of a PDF onto plain <canvas> elements instead of embedding
// the browser's native PDF plugin. That's what makes right-click blocking and a
// chrome-free (no toolbar/thumbnail rail) preview actually possible — a native
// <iframe src="blob:..."> viewer's own context menu can't be intercepted from
// page JS, but a <canvas>'s contextmenu event is a normal DOM event.
//
// Canvases are created and appended imperatively (not driven by React state)
// so the whole load-and-paint sequence lives in a single effect with one
// cancellation flag. Splitting "discover page count" and "paint pages" across
// two effects sharing a ref caused React StrictMode's dev-mode double-invoke
// to start two overlapping render() calls on the *same* canvas element, and
// the first one's promise would hang forever instead of settling.
const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ blob, className }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [hasPages, setHasPages] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) wrapper.innerHTML = "";
    setHasPages(false);
    if (!blob || !wrapper) return undefined;

    let cancelled = false;
    let currentTask: ReturnType<pdfjsLib.PDFPageProxy["render"]> | null = null;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
    setLoading(true);

    (async () => {
      const arrayBuffer = await blob.arrayBuffer();
      if (cancelled) return;

      loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      if (cancelled) {
        loadingTask.destroy();
        return;
      }
      setLoading(false);
      setHasPages(true);

      const containerWidth = Math.max((wrapper.clientWidth || 800) - 32, 200);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (cancelled) return;
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: scale * dpr });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        canvas.style.display = "block";
        canvas.style.margin = "0 auto 16px auto";
        canvas.style.boxShadow = "0 4px 16px rgba(0,0,0,0.35)";
        canvas.style.borderRadius = "4px";
        canvas.style.background = "#fff";
        canvas.oncontextmenu = (e) => e.preventDefault();
        wrapper.appendChild(canvas);

        const task = page.render({ canvas, viewport });
        currentTask = task;
        try {
          await task.promise;
        } catch {
          // Expected when this effect instance gets cancelled mid-render.
        }
        currentTask = null;
      }
    })();

    return () => {
      cancelled = true;
      currentTask?.cancel();
      loadingTask?.destroy();
    };
  }, [blob]);

  return (
    <div className={`relative ${className || ""}`} onContextMenu={(e) => e.preventDefault()} style={{ userSelect: "none" }}>
      {/* Canvases are appended here imperatively (see effect above) — React never
          manages this div's children, so it's kept separate from the loading
          indicator below to avoid any reconciliation conflicts. */}
      <div ref={wrapperRef} />
      {loading && !hasPages && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm pointer-events-none">
          Loading preview…
        </div>
      )}
    </div>
  );
};

export default PdfCanvasViewer;
