import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share2, Copy, Check, X, Printer, MapPin } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { buildParishLinkUrl } from '../../utils/parishLink';
import { splitActiveParish } from '../../utils/parish';

interface ParishQRDialogProps {
  open: boolean;
  /** Cadena de parroquia/capilla activa (la misma que se guarda en los cantorales). */
  parish: string;
  onClose: () => void;
}

/**
 * QR PERMANENTE de la parroquia/capilla. A diferencia del QR por cantoral, este es un
 * único QR estable para imprimir y dejar pegado en la iglesia: siempre lleva al
 * cantoral vigente de esa parroquia (enlace /i/{parroquia}).
 */
export function ParishQRDialog({ open, parish, onClose }: ParishQRDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = buildParishLinkUrl(parish);
  const { parishFull, chapel } = splitActiveParish(parish);
  const label = parishFull || parish;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((u) => { if (!cancelled) setQrDataUrl(u); })
      .catch((err) => {
        console.error('Error generando QR permanente:', err);
        toast.error('No se pudo generar el código QR.');
      });
    return () => { cancelled = true; };
  }, [open, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_permanente_${label.replace(/[^\w\-]+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR descargado');
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const w = window.open('', '_blank', 'width=520,height=760');
    if (!w) {
      handleDownload();
      toast.info('Descargamos el QR para que lo imprimas', {
        description: 'Tu navegador bloqueó la ventana de impresión.',
      });
      return;
    }
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>QR de la parroquia</title>` +
      `<style>body{font-family:system-ui,Arial,sans-serif;text-align:center;padding:28px;color:#1e3a8a}` +
      `h2{margin:0 0 4px}h3{margin:0 0 8px;color:#475569;font-weight:600}p{margin:6px 0;color:#475569}` +
      `img{width:360px;height:360px;margin:16px auto}.big{font-size:20px;font-weight:700;color:#1e3a8a;margin-top:8px}` +
      `.link{font-size:11px;color:#94a3b8;word-break:break-all}</style></head><body>` +
      `<h2>${esc(label)}</h2>` +
      (chapel ? `<h3>${esc(chapel)}</h3>` : '') +
      `<img src="${qrDataUrl}" alt="QR"/>` +
      `<p class="big">Escanea para ver el cantoral de la Misa</p>` +
      `<p class="link">${esc(url)}</p>` +
      `</body></html>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch { /* imprimir manual */ } }, 350);
  };

  const handleShare = async () => {
    if (!navigator.share) { handleCopy(); return; }
    try {
      await navigator.share({
        title: `Cantoral · ${label}`,
        text: 'Escanea para seguir el cantoral de la Misa',
        url,
      });
    } catch { /* cancelado */ }
  };

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={onClose} />

      <div
        className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-4 border-brand-border animate-fadeInUp transition-colors max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 sm:top-3 sm:right-3 w-11 h-11 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>

        <div className="text-center mb-5">
          <div className="text-4xl mb-2">⛪</div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">QR permanente de la parroquia</h2>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Imprímelo y pégalo en la iglesia: siempre llevará al cantoral vigente
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
            {label}{chapel ? ` · ${chapel}` : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-4 border-4 border-blue-100 dark:border-brand-border mx-auto" style={{ maxWidth: '320px' }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR permanente de la parroquia" className="w-full h-auto block" />
          ) : (
            <div className="aspect-square flex items-center justify-center bg-slate-50">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Aviso: es estable, no cambia al publicar */}
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800 flex gap-2">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 dark:text-emerald-200">
            Este QR <strong>no cambia</strong> cuando publicas un cantoral nuevo. Imprímelo una sola vez;
            cada Misa mostrará automáticamente su cantoral. Si hay varias Misas ese día, quien escanee podrá elegir.
          </p>
        </div>

        <div className="mb-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Enlace permanente</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 font-mono break-all">{url}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-blue-700 dark:text-blue-300" />}
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Descargar</span>
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
          onClick={handlePrint}
          disabled={!qrDataUrl}
          className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-br from-brand to-brand-strong text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border-2 border-brand-border shadow-lg disabled:opacity-50"
        >
          <Printer className="w-5 h-5" />
          Imprimir QR para la iglesia
        </button>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-base font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Listo
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
