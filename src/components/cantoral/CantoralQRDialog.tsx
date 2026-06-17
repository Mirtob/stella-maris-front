import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share2, Copy, Check, X, FileDown } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { safeWindowOpen } from '../../utils/safeUrl';

interface CantoralQRDialogProps {
  open: boolean;
  cantoralId: string;
  cantoralLabel?: string;  // e.g. "Domingo 5 de Pascua · 10:00 AM"
  parishName?: string;
  pdfUrl?: string;          // URL pública del PDF del cantoral (Supabase Storage)
  onClose: () => void;
}

/**
 * QR dialog shown after a cantoral is successfully published.
 * The QR encodes the deep-link {origin}/c/{cantoralId} that opens the cantoral
 * in the app (or sends the user through login if unauthenticated).
 */
export function CantoralQRDialog({
  open,
  cantoralId,
  cantoralLabel,
  parishName,
  pdfUrl,
  onClose,
}: CantoralQRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const deepLink = `${window.location.origin}/c/${cantoralId}`;

  // Generate QR on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(deepLink, {
      width: 512,
      margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch((err) => {
        console.error('Error generando QR:', err);
        toast.error('No se pudo generar el código QR.');
      });
    return () => { cancelled = true; };
  }, [open, deepLink]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Cantoral_${cantoralId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR descargado');
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: parishName ? `Cantoral · ${parishName}` : 'Cantoral',
        text: cantoralLabel ?? 'Mira el cantoral de la Misa',
        url: deepLink,
      });
    } catch {
      // User cancelled — silent
    }
  };

  if (!open) return null;

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={onClose}
      />

      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-4 border-blue-800 animate-fadeInUp transition-colors max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — 44x44 touch target per Apple HIG, with negative margin
            offset so it sits in the safe corner without overlapping the QR. */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:top-3 sm:right-3 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">📲</div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-950 dark:text-white">
            ¡Cantoral publicado!
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Comparte este QR con tu comunidad
          </p>
          {cantoralLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              {cantoralLabel}
            </p>
          )}
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-4 mb-5 border-4 border-blue-100 dark:border-blue-800 mx-auto" style={{ maxWidth: '320px' }}>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR del cantoral"
              className="w-full h-auto block"
            />
          ) : (
            <div className="aspect-square flex items-center justify-center bg-slate-50">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Deep link preview */}
        <div className="mb-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Enlace directo
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono break-all">
            {deepLink}
          </p>
        </div>

        {/* Descargar PDF del coro (Full Score con acordes) — botón prominente.
            El coro lo necesita para tener el folleto en el teléfono offline durante
            la Misa, sin depender de Supabase. Es DISTINTO del PDF que descarga la
            comunidad desde el QR (ese es el folleto de letras del Pueblo fiel). */}
        {pdfUrl && (
          <button
            onClick={() => {
              const opened = safeWindowOpen(pdfUrl);
              if (!opened) toast.error('No se pudo abrir el PDF.');
            }}
            className="w-full mb-3 py-3 px-4 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold flex items-center justify-center gap-2 active:scale-95 hover:opacity-95 transition-all border-2 border-emerald-700 shadow-lg"
          >
            <FileDown className="w-5 h-5" />
            Descargar PDF del coro (con acordes)
          </button>
        )}

        {/* Acciones secundarias */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            {copied
              ? <Check className="w-5 h-5 text-emerald-600" />
              : <Copy className="w-5 h-5 text-blue-700 dark:text-blue-300" />}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {copied ? 'Copiado' : 'Copiar'}
            </span>
          </button>

          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Descargar
            </span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs font-semibold">Compartir</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-base font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Listo
        </button>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
