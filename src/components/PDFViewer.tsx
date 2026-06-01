import { useEffect, useState } from 'react';
import { ExternalLink, Download, Loader } from 'lucide-react';

interface PDFViewerProps {
  proxyUrl: string;
  driveViewUrl: string;
  title: string;
}

export function PDFViewer({ proxyUrl, driveViewUrl, title }: PDFViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);

    fetch(proxyUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando partitura:', err);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proxyUrl]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg flex flex-col items-center justify-center gap-3 p-8" style={{ minHeight: 200 }}>
        <Loader className="w-8 h-8 text-blue-700 animate-spin" />
        <p className="text-sm text-gray-600">Cargando partitura...</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="bg-white rounded-lg flex flex-col items-center justify-center gap-4 p-6" style={{ minHeight: 200 }}>
        <div className="text-4xl">📄</div>
        <p className="text-sm text-gray-500 text-center">No se pudo cargar el PDF en la app</p>
        <div className="flex gap-2 w-full">
          <a
            href={driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-900 text-white py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir en Drive
          </a>
          <a
            href={proxyUrl}
            download={`${title}.pdf`}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            Descargar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Botones de acción */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-2 justify-end">
        <a
          href={proxyUrl}
          download={`${title}.pdf`}
          className="flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold"
        >
          <Download className="w-3 h-3" />
          Descargar
        </a>
        <a
          href={driveViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs bg-blue-900 text-white px-3 py-1.5 rounded-lg font-bold"
        >
          <ExternalLink className="w-3 h-3" />
          Drive
        </a>
      </div>

      {/* PDF renderizado desde blob URL — mismo origen, sin bloqueos */}
      <iframe
        src={blobUrl}
        title={`Partitura: ${title}`}
        className="w-full border-0"
        style={{ height: '70vh', minHeight: 400 }}
      />
    </div>
  );
}
