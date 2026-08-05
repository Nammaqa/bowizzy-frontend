import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import type { ResumeData } from "@/types/resume";
import PdfCanvasViewer from "./PdfCanvasViewer";

interface PdfSplitPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  PDFComponent?: React.ComponentType<any>;
  primaryColor?: string;
  fontFamily?: string;
}

// Lightweight companion to ResumePreviewModal's full "Bowizzy Preview" dialog —
// same canvas-based renderer (right-click blocked, no toolbar/thumbnail rail,
// native scroll), but generates straight from the template's PDFComponent
// instead of the heavier html2canvas/page-marker pipeline, since this is meant
// as a quick "what will this look like split into pages" check while editing.
const PdfSplitPreviewModal: React.FC<PdfSplitPreviewModalProps> = ({
  isOpen,
  onClose,
  resumeData,
  PDFComponent,
  primaryColor,
  fontFamily,
}) => {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !PDFComponent) {
      setBlob(null);
      setError(false);
      return undefined;
    }
    let cancelled = false;
    setError(false);
    setBlob(null);
    (async () => {
      try {
        const generated = await pdf(
          <PDFComponent data={resumeData} primaryColor={primaryColor} fontFamily={fontFamily} />
        ).toBlob();
        if (!cancelled) setBlob(generated);
      } catch (err) {
        console.error("PDF preview generation failed:", err);
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, PDFComponent, resumeData, primaryColor, fontFamily]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
            <h3 className="text-base font-semibold text-gray-900">Template Preview</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 min-h-0 bg-[#262626] p-2">
            {!blob && !error && (
              <div className="flex items-center justify-center h-full gap-2 text-white/70 text-sm">
                <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                Generating preview…
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-white/70 text-sm">
                Couldn't generate the preview. Please try again.
              </div>
            )}
            {blob && <PdfCanvasViewer blob={blob} className="h-full overflow-y-auto rounded-lg p-4" />}
          </div>
        </div>
      </div>
    </>
  );
};

export default PdfSplitPreviewModal;
