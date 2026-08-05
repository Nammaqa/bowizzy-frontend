import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer';
import PdfCanvasViewer from '@/pages/(ResumeBuilder)/components/ui/PdfCanvasViewer';

const SimpleDoc = () => (
  <Document>
    <Page size="A4" style={{ padding: 40 }}>
      <View>
        <Text style={{ fontSize: 24 }}>Hello Canvas Test</Text>
        <Text style={{ fontSize: 12, marginTop: 20 }}>If you can see this text rendered onto a canvas, the PdfCanvasViewer component works correctly.</Text>
      </View>
    </Page>
  </Document>
);

export default function PreviewCanvasSimple() {
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    (async () => {
      const b = await pdf(<SimpleDoc />).toBlob();
      console.log('[test] generated blob size', b.size);
      (window as any).__testBlob = b;
      setBlob(b);
    })();
  }, []);

  return (
    <div style={{ width: 600, height: 800, background: '#333' }}>
      <PdfCanvasViewer blob={blob} className="relative w-full h-full overflow-y-auto p-4" />
    </div>
  );
}
