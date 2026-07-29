import React, { Suspense, useState, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiTemplateRegistry } from './templates/aiTemplateRegistry';
import { mapInfoJsonToResumeData } from './mapInfoJsonToResumeData';

interface AiResumePreviewProps {
  infoJson: any;
  onClose?: () => void;
}

const AiResumePreview: React.FC<AiResumePreviewProps> = ({ infoJson, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const resumeData = useMemo(() => mapInfoJsonToResumeData(infoJson), [infoJson]);

  const selectedTemplate = aiTemplateRegistry[selectedIndex];
  const DisplayComponent = selectedTemplate.displayComponent;
  const PdfComponent = selectedTemplate.pdfComponent;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const blob = await pdf(
        <PdfComponent data={resumeData} primaryColor={selectedTemplate.primaryColor} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personal.firstName || 'Resume'}_${resumeData.personal.lastName || ''}_AI_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  
  const handlePrev = () => setSelectedIndex((prev) => (prev === 0 ? aiTemplateRegistry.length - 1 : prev - 1));
  const handleNext = () => setSelectedIndex((prev) => (prev === aiTemplateRegistry.length - 1 ? 0 : prev + 1));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 transition">
              ← Back to Chat
            </button>
          )}
          <h2 className="text-sm font-semibold text-gray-800">Resume Preview</h2>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      {/* Template selector */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 shrink-0 overflow-x-auto">
        {aiTemplateRegistry.map((tmpl, i) => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedIndex(i)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition whitespace-nowrap ${
              i === selectedIndex
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'
            }`}
          >
            {tmpl.name}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        <div className="relative">
          {/* Nav arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-[-40px] top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition z-10"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition z-10"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>

          {/* Resume display */}
          <div
            className="bg-white shadow-lg border border-gray-200"
            style={{
              width: '210mm',
              minHeight: '297mm',
              transform: 'scale(0.6)',
              transformOrigin: 'top center',
            }}
          >
            <Suspense fallback={<div className="flex items-center justify-center h-96 text-gray-400">Loading template...</div>}>
              <DisplayComponent data={resumeData} primaryColor={selectedTemplate.primaryColor} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiResumePreview;
