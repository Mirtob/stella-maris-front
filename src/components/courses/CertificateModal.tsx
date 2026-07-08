import { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, Loader } from 'lucide-react';

interface Props {
  name: string;
  title: string;   // p. ej. "Cantor Litúrgico — Fundamentos"
  onClose: () => void;
}

/**
 * Certificado de formación dibujado en canvas (autocontenido, sin dependencias). Se puede
 * descargar y compartir como imagen PNG.
 */
export function CertificateModal({ name, title, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const W = 1200, H = 848;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    canvasRef.current = c;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Fondo vitela
    ctx.fillStyle = '#f5f0e4'; ctx.fillRect(0, 0, W, H);
    // Marco doble en oro
    ctx.strokeStyle = '#9a7636'; ctx.lineWidth = 6; ctx.strokeRect(34, 34, W - 68, H - 68);
    ctx.strokeStyle = '#c39a4e'; ctx.lineWidth = 2; ctx.strokeRect(50, 50, W - 100, H - 100);

    const center = (text: string, y: number, font: string, color: string) => {
      ctx.fillStyle = color; ctx.font = font; ctx.textAlign = 'center';
      ctx.fillText(text, W / 2, y);
    };

    center('✶', 150, '54px Georgia, serif', '#9a7636');
    center('CERTIFICADO DE FORMACIÓN', 220, 'bold 30px Georgia, serif', '#221d2e');
    center('Se otorga a', 300, 'italic 24px Georgia, serif', '#5c5568');

    // Nombre (se achica si es largo)
    let fs = 62;
    ctx.font = `bold ${fs}px Georgia, serif`;
    while (ctx.measureText(name).width > W - 260 && fs > 28) { fs -= 2; ctx.font = `bold ${fs}px Georgia, serif`; }
    center(name, 386, `bold ${fs}px Georgia, serif`, '#221d2e');

    // Línea bajo el nombre
    ctx.strokeStyle = '#d8cfb8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 410); ctx.lineTo(W - 300, 410); ctx.stroke();

    center('por completar el itinerario de formación', 470, '24px Georgia, serif', '#5c5568');
    center(title, 528, 'bold 40px Georgia, serif', '#5b3f7a');

    // Frase
    center('«El que canta bien, ora dos veces.»', 610, 'italic 22px Georgia, serif', '#9a7636');

    // Pie
    center('Stella Maris · Música Católica', 720, 'bold 22px Georgia, serif', '#221d2e');
    const fecha = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    center(fecha, 756, '18px Georgia, serif', '#5c5568');

    setDataUrl(c.toDataURL('image/png'));
    c.toBlob((b) => setBlob(b), 'image/png');
  }, [name, title]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Certificado_${name.replace(/[^\w]+/g, '_')}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const share = async () => {
    try {
      if (blob && navigator.canShare?.({ files: [new File([blob], 'certificado.png', { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], 'certificado.png', { type: 'image/png' })],
          title: 'Mi certificado de formación',
          text: `¡Completé "${title}" en Stella Maris! 🎓`,
        });
      } else if (navigator.share) {
        await navigator.share({ title: 'Mi certificado de formación', text: `¡Completé "${title}" en Stella Maris! 🎓` });
      } else {
        download();
      }
    } catch { /* cancelado */ }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-amber-300 dark:border-amber-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <h2 className="font-bold text-lg">Tu certificado</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          {dataUrl ? (
            <img src={dataUrl} alt="Certificado de formación" className="w-full h-auto rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow" />
          ) : (
            <div className="aspect-[1200/848] flex items-center justify-center text-gray-400"><Loader className="w-8 h-8 animate-spin" /></div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={download} disabled={!dataUrl} className="flex-1 bg-white dark:bg-slate-800 text-brand-ink border-2 border-amber-300 dark:border-amber-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
              <Download className="w-5 h-5" /> Descargar
            </button>
            <button onClick={share} disabled={!dataUrl} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
              <Share2 className="w-5 h-5" /> Compartir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
