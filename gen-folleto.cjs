const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const APP_URL = 'https://stella-maris-front.vercel.app';
// El QR lleva DIRECTO al módulo de instalación, no a la raíz. Tras el lanzamiento del
// 29-ago-2026 quedó claro que el problema no era llegar a la app sino instalarla: en
// /instalar hay un botón de un toque y, si el navegador no lo ofrece, los pasos del
// teléfono que la persona tiene de verdad. Desde ahí se entra igual a la app.
const INSTALL_URL = `${APP_URL}/instalar`;
const OUT_DIR = path.join(__dirname, 'docs', 'presentacion');
const PDF_PATH = path.join(OUT_DIR, 'Stella-Maris-Instalacion-y-Presentacion.pdf');
const QR_PATH = path.join(OUT_DIR, 'QR-app.png');

const BLUE = [30, 58, 138];
const GOLD = [217, 119, 6];
const DARK = [40, 40, 40];
const GRAY = [110, 110, 110];

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const qr = await QRCode.toDataURL(INSTALL_URL, {
    width: 700, margin: 1, errorCorrectionLevel: 'M',
    color: { dark: '#1e3a8a', light: '#ffffff' },
  });
  fs.writeFileSync(QR_PATH, Buffer.from(qr.split(',')[1], 'base64'));

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 16;
  const text = (t, x, y, opt) => doc.text(t, x, y, opt);
  const wrap = (t, w) => doc.splitTextToSize(t, w);

  // ============================ PÁGINA 1 — FOLLETO ============================
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  text('Stella Maris', M, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
  text('App de cantorales para tu parroquia', M, 22);

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  text('Instálala en tu teléfono', M, 42);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...GRAY);
  text('Es gratis y no necesitas ir a ninguna tienda de apps.', M, 49);

  const qrSize = 52;
  const qrX = (W - qrSize) / 2;
  doc.setDrawColor(...BLUE); doc.setLineWidth(0.8);
  doc.roundedRect(qrX - 4, 56, qrSize + 8, qrSize + 8, 3, 3, 'S');
  doc.addImage(qr, 'PNG', qrX, 60, qrSize, qrSize);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...BLUE);
  text('Escanea y te guiamos paso a paso', W / 2, 122, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...GRAY);
  text(INSTALL_URL, W / 2, 128, { align: 'center' });

  const boxY = 138, boxH = 62, gap = 8;
  const boxW = (W - M * 2 - gap) / 2;
  const drawBox = (x, title, steps) => {
    doc.setFillColor(245, 247, 251);
    doc.setDrawColor(210, 216, 228); doc.setLineWidth(0.4);
    doc.roundedRect(x, boxY, boxW, boxH, 3, 3, 'FD');
    doc.setFillColor(...BLUE);
    doc.roundedRect(x, boxY, boxW, 11, 3, 3, 'F');
    doc.rect(x, boxY + 6, boxW, 5, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    text(title, x + 5, boxY + 7.5);
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6);
    let yy = boxY + 18;
    steps.forEach((s, i) => {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...GOLD);
      text(`${i + 1}.`, x + 5, yy);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...DARK);
      const lines = wrap(s, boxW - 14);
      lines.forEach((ln, k) => text(ln, x + 10, yy + k * 4.6));
      yy += lines.length * 4.6 + 2.2;
    });
  };
  drawBox(M, 'En Android', [
    'Escanea el QR con la cámara del teléfono.',
    'Toca el botón azul "Instalar la aplicación" y confirma.',
    'Si ese botón no aparece, la misma pantalla te dice dónde está la opción en TU teléfono.',
    'Queda con su ícono, como una app normal.',
  ]);
  drawBox(M + boxW + gap, 'En iPhone', [
    'Escanea el QR y ábrelo en Safari.',
    'Toca Compartir (el cuadro con la flecha hacia arriba).',
    'Desliza y elige "Añadir a pantalla de inicio".',
    'Ábrela desde el ícono: eso hace falta para recibir los avisos.',
  ]);
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8.6); doc.setTextColor(...GRAY);
  text('Si abriste el enlace dentro de WhatsApp o Instagram, no se puede instalar: ábrelo en Chrome (o Safari).', W / 2, boxY + boxH + 6, { align: 'center' });
  text('En iPhone solo Safari puede instalarla. Chrome en iPhone no.', W / 2, boxY + boxH + 10.5, { align: 'center' });

  let fy = boxY + boxH + 22;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...BLUE);
  text('¿Qué puedes hacer?', M, fy);
  fy += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...DARK);
  const feats = [
    'Ver el cantoral de cada Misa: letras, horarios y el orden de la celebración.',
    'Escuchar los cantos y seguir la Misa desde el teléfono.',
    'Recibir un aviso cuando tu parroquia publica un cantoral nuevo (se activan en la misma pantalla).',
    'Coro: armar y publicar cantorales, ver partituras y usar el Modo Atril.',
    'Funciona sin internet una vez que la abriste (útil dentro de la iglesia).',
  ];
  feats.forEach((f) => {
    doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); text('-', M, fy);
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal');
    const ls = wrap(f, W - M * 2 - 6);
    ls.forEach((ln, k) => text(ln, M + 5, fy + k * 5));
    fy += ls.length * 5 + 1.5;
  });

  doc.setDrawColor(...BLUE); doc.setLineWidth(0.5);
  doc.line(M, H - 20, W - M, H - 20);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...BLUE);
  text('Pide ayuda a tu coro si algo no te resulta', M, H - 13);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); doc.setFontSize(9);
  text('Stella Maris · Cantorales', W - M, H - 13, { align: 'right' });

  // ==================== PÁGINA 2 — GUION DE PRESENTACIÓN ====================
  doc.addPage();
  doc.setFillColor(...BLUE); doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  text('Guion de presentación (15 min + preguntas)', M, 14);

  doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  text('Estructura sugerida. Cada bloque son 1-2 diapositivas. La lista de slides está en la última página.', M, 30);

  const blocks = [
    ['0:00 - 1:30', 'Bienvenida', 'Qué es Stella Maris y qué problema resuelve (cantorales a mano, coordinar coro y comunidad).'],
    ['1:30 - 4:00', 'Cómo instalarla', 'Muestra el QR en pantalla y guía la instalación EN VIVO (Android y iPhone). Que la instalen ahí mismo.'],
    ['4:00 - 8:00', 'Para el Pueblo fiel', 'Demo: abrir el cantoral de la Misa, ver letras y horarios, escuchar cantos. El QR permanente pegado en la iglesia.'],
    ['8:00 - 12:00', 'Para el Coro', 'Demo: armar y publicar un cantoral, ver partituras, Modo Atril (Órgano = partituras / Guitarra = acordes).'],
    ['12:00 - 14:00', 'Cómo empezar', 'Roles (Pueblo fiel / Coro), cómo pedir cuenta de Coro, y a quién acudir por soporte.'],
    ['14:00 - 15:00', 'Cierre', 'Próximos pasos: marcha blanca y, si se reúne el presupuesto, publicación en Google Play a fin de mes. Agradecer.'],
  ];
  let y = 40;
  blocks.forEach(([time, title, desc]) => {
    doc.setFillColor(...GOLD); doc.roundedRect(M, y - 4.5, 26, 7, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    text(time, M + 13, y, { align: 'center' });
    doc.setTextColor(...BLUE); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    text(title, M + 30, y);
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6);
    const lines = wrap(desc, W - M - (M + 30));
    lines.forEach((ln, k) => text(ln, M + 30, y + 5.5 + k * 4.6));
    y += 5.5 + lines.length * 4.6 + 5;
  });

  y += 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...BLUE);
  text('Consejos para el presentador', M, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6); doc.setTextColor(...DARK);
  const tips = [
    'Antes de empezar: ten la app abierta y un cantoral de ejemplo publicado y vigente.',
    'Proyecta el QR EN GRANDE durante el bloque de instalación para que instalen en el momento.',
    'Offline: ábrela CON internet y revisa un cantoral; recién ahí activa el modo avión para mostrar que sigue funcionando.',
    'Ten listo 1 canto con partitura y 1 con letra para lucir el Modo Atril.',
    'Deja folletos impresos en las bancas y el QR permanente pegado a la entrada.',
  ];
  tips.forEach((t) => {
    doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); text('-', M, y);
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal');
    const ls = wrap(t, W - M * 2 - 6);
    ls.forEach((ln, k) => text(ln, M + 5, y + k * 4.8));
    y += ls.length * 4.8 + 1.5;
  });

  y += 4;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...BLUE);
  text('Checklist del día', M, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6); doc.setTextColor(...DARK);
  const checks = [
    'App desplegada y funcionando (revisar el deploy en Vercel).',
    'Un cantoral de ejemplo publicado y vigente.',
    'QR impreso (folleto) y QR en la diapositiva.',
    'Proyector / pantalla y sonido probados.',
    'Cuenta de Coro de demostración lista.',
  ];
  checks.forEach((c) => {
    doc.setDrawColor(...GRAY); doc.setLineWidth(0.4); doc.rect(M, y - 3.2, 3.6, 3.6, 'S');
    const ls = wrap(c, W - M * 2 - 8);
    ls.forEach((ln, k) => text(ln, M + 6, y + k * 4.8));
    y += ls.length * 4.8 + 1.8;
  });

  // ==================== PÁGINA 3 — DIAPOSITIVAS SUGERIDAS ====================
  doc.addPage();
  doc.setFillColor(...BLUE); doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  text('Diapositivas sugeridas (11)', M, 14);
  doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  text('Una base para armar la PPT. Ajusta textos e imágenes a tu parroquia.', M, 30);

  const slides = [
    ['1. Portada', 'Logo + "Stella Maris · Cantorales" + parroquia y fecha (29 de agosto).'],
    ['2. El problema', 'Cantorales en papel, coordinar coro y comunidad, buscar letras y partituras.'],
    ['3. La solución', 'Una app en el teléfono con el cantoral de cada Misa. Captura de la pantalla de inicio.'],
    ['4. Cómo instalarla', 'QR grande + pasos Android y iPhone (instalación en vivo).'],
    ['5. Pueblo fiel: ver el cantoral', 'Captura: lista de Misas y un cantoral abierto con las letras.'],
    ['6. Pueblo fiel: escuchar y seguir', 'Captura: reproducir cantos. El QR permanente pegado en la iglesia.'],
    ['7. Coro: armar el cantoral', 'Captura: constructor por momentos de la Misa; publicar.'],
    ['8. Coro: partituras', 'Captura: partitura de un canto (Banco de Partituras).'],
    ['9. Coro: Modo Atril', 'Captura: documento continuo. Órgano = partituras / Guitarra = acordes.'],
    ['10. Cómo empezar', 'Roles, cómo pedir cuenta de Coro y contacto de soporte.'],
    ['11. Cierre', 'Marcha blanca, Google Play a fin de mes (si hay presupuesto) y agradecimiento.'],
  ];
  let sy = 40;
  slides.forEach(([t, d]) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...BLUE);
    text(t, M, sy);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6); doc.setTextColor(...DARK);
    const lines = wrap(d, W - M * 2);
    lines.forEach((ln, k) => text(ln, M, sy + 5 + k * 4.6));
    sy += 5 + lines.length * 4.6 + 4.5;
  });

  doc.setDrawColor(...BLUE); doc.line(M, H - 20, W - M, H - 20);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
  text('El QR (que lleva a /instalar) también está aparte: QR-app.png, para pegarlo en la PPT o imprimirlo.', M, H - 13);

  fs.writeFileSync(PDF_PATH, Buffer.from(doc.output('arraybuffer')));
  console.log('OK PDF  ->', PDF_PATH);
  console.log('OK QR   ->', QR_PATH);
})();
