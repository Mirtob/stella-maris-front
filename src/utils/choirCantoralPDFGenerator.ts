import jsPDF from 'jspdf';
import { Song, InstrumentType } from '../types';
import { isOrdinary } from './ordinary';
import { formatYmdForDisplay } from './dateLocal';
import { embedPartituraPages } from './embedPartitura';
import { stripLyricsFormatting } from './lyricsFormat';
import { pickVideoUrl } from './songVideo';

type VoiceSelection = 'Soprano' | 'Contralto' | 'Tenor' | 'Bajo' | 'Full Score';

interface GenerateOptions {
  /** Si true, dispara la descarga local del PDF. Default: true (compatibilidad). */
  download?: boolean;
  /**
   * Embebe las páginas de la partitura (PDF de Drive) en una sección al final.
   * Requiere red (descarga cada partitura vía el proxy). Default: false.
   *   - `true`       → todas las partituras (folleto Full Score del Coro).
   *   - `'ordinary'` → solo el ordinario + Padre Nuestro (PDF publicado/QR, más liviano).
   */
  embedScores?: boolean | 'ordinary';
}

export const generateChoirCantoralPDF = async (
  songs: Song[],
  parishName: string,
  date: string,
  celebration?: string,
  massTime?: string,
  userInstruments: InstrumentType[] = [],
  // Se recibe pero no se aplica. Este módulo NO lo importa nadie (el cuadernillo
  // real es utils/atrilBookletPDF.ts, que sí reparte por voz).
  _voiceSelection: VoiceSelection = 'Full Score',
  options: GenerateOptions = { download: true }
): Promise<{ blob: Blob; fileName: string }> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Función para verificar si necesitamos una nueva página
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Función para agregar el logo de la app
  const addLogo = (size: number = 8) => {
    // Logo de la app - Círculo azul con cruz blanca
    pdf.setFillColor(30, 58, 138); // blue-900
    pdf.circle(pageWidth / 2, yPosition + size, size, 'F');
    
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1.5);
    // Cruz dentro del círculo
    pdf.line(pageWidth / 2, yPosition + size - (size * 0.6), pageWidth / 2, yPosition + size + (size * 0.6));
    pdf.line(pageWidth / 2 - (size * 0.6), yPosition + size, pageWidth / 2 + (size * 0.6), yPosition + size);
    
    yPosition += size * 2 + 5;
  };

  // Página de portada
  addLogo(10);

  // Título principal
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138); // blue-900
  const title = 'Cantoral de la Misa';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 15;

  // Fecha
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(55, 65, 81); // gray-700
  // Local, no UTC (ver dateLocal): si no, la portada muestra el día anterior.
  const formattedDate = formatYmdForDisplay(date);
  const dateWidth = pdf.getTextWidth(formattedDate);
  pdf.text(formattedDate, (pageWidth - dateWidth) / 2, yPosition);
  yPosition += 10;

  // Celebración litúrgica. Se parte en varias líneas si hace falta: un nombre largo
  // ("Solemnidad de …, patronos de la parroquia") se salía de la hoja por los dos lados.
  if (celebration) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(147, 51, 234); // purple-600
    const lineas = pdf.splitTextToSize(celebration, pageWidth - 40) as string[];
    for (const linea of lineas) {
      pdf.text(linea, (pageWidth - pdf.getTextWidth(linea)) / 2, yPosition);
      yPosition += 7;
    }
    yPosition += 3;
  }

  // Horario
  if (massTime) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // gray-500
    const timeText = `Misa de ${massTime}`;
    const timeWidth = pdf.getTextWidth(timeText);
    pdf.text(timeText, (pageWidth - timeWidth) / 2, yPosition);
    yPosition += 8;
  }

  // Parroquia
  if (parishName) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // gray-500
    const parishWidth = pdf.getTextWidth(parishName);
    pdf.text(parishName, (pageWidth - parishWidth) / 2, yPosition);
    yPosition += 15;
  }

  // Línea divisoria
  pdf.setDrawColor(209, 213, 219); // gray-300
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Info sobre el folleto
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(75, 85, 99); // gray-600
  const infoText = 'Folleto digital para miembros del coro';
  const infoWidth = pdf.getTextWidth(infoText);
  pdf.text(infoText, (pageWidth - infoWidth) / 2, yPosition);
  yPosition += 6;

  // Indicar el instrumento utilizado
  if (userInstruments.includes('Guitarra')) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74); // green-600
    const instrumentText = '🎸 Versión para Guitarra';
    const instrumentWidth = pdf.getTextWidth(instrumentText);
    pdf.text(instrumentText, (pageWidth - instrumentWidth) / 2, yPosition);
    yPosition += 8;
  } else if (userInstruments.includes('Órgano')) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138); // blue-900
    const instrumentText = '🎹 Versión para Órgano';
    const instrumentWidth = pdf.getTextWidth(instrumentText);
    pdf.text(instrumentText, (pageWidth - instrumentWidth) / 2, yPosition);
    yPosition += 8;
  }

  yPosition += 10;

  // Agrupar cantos por categoría
  const categoryOrder = [
    'Entrada',
    'Rito de Aspersión',
    'Kyrie',
    'Gloria',
    'Salmo',
    'Aleluya',
    'Aclamación al Evangelio',
    'Post Evangelio',
    'Respuesta a Oración Universal',
    'Ofertorio',
    'Santo',
    'Aclamación Consagración',
    'Amén (Doxología)',
    'Padre Nuestro',
    'Tuyo es el Reino',
    'Cordero de Dios',
    'Comunión',
    'Salida'
  ];

  const groupedSongs = songs.reduce((acc, song) => {
    if (!acc[song.category]) {
      acc[song.category] = [];
    }
    acc[song.category].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const sortedCategories = Object.keys(groupedSongs).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Iconos para categorías
  const categoryIcons: Record<string, string> = {
    'Entrada': '⛪',
    'Kyrie': '🙏',
    'Gloria': '✨',
    'Santo': '✝️',
    'Cordero de Dios': '🐑',
    'Credo': '📿',
    'Padre Nuestro': '🙏',
    'Salmo': '📖',
    'Aleluya': '🎺',
    'Aclamación al Evangelio': '📯',
    'Post Evangelio': '📿',
    'Ofertorio': '🍇',
    'Comunión': '🫓',
    'Salida': '⛪',
  };

  // Función para procesar letra con acordes (para guitarristas)
  const renderLyricsWithChords = (lyrics: string, yStart: number): number => {
    let y = yStart;
    const lines = stripLyricsFormatting(lyrics).split('\n');
    
    pdf.setFontSize(9);
    pdf.setFont('courier', 'normal'); // Courier para mantener alineación
    
    for (const line of lines) {
      checkNewPage(8);
      
      // Detectar si es un encabezado de sección
      if (/^(Coro|Estrofa|Puente|Intro|Final|Verso)(\s+\d+)?:?\s*$/i.test(line.trim())) {
        pdf.setFont('courier', 'bold');
        pdf.setTextColor(139, 92, 246); // purple-500
        pdf.text(line, margin + 5, y);
        y += 6;
        continue;
      }
      
      // Procesar acordes [X] en la línea
      const chordRegex = /\[([^\]]+)\]/g;
      let hasChords = chordRegex.test(line);
      
      if (hasChords) {
        // Extraer acordes
        const chords: Array<{chord: string, position: number}> = [];
        let match;
        chordRegex.lastIndex = 0; // Reset regex
        
        while ((match = chordRegex.exec(line)) !== null) {
          chords.push({
            chord: match[1],
            position: match.index
          });
        }
        
        // Dibujar acordes encima de la línea
        pdf.setFont('courier', 'bold');
        pdf.setTextColor(30, 58, 138); // blue-900
        
        chords.forEach(({chord, position}) => {
          const textBeforeChord = line.substring(0, position).replace(/\[[^\]]+\]/g, '');
          const xOffset = pdf.getTextWidth(textBeforeChord);
          pdf.text(chord, margin + 5 + xOffset, y - 3);
        });
        
        y += 4;
        
        // Dibujar letra sin los acordes
        const lyricsOnly = line.replace(/\[([^\]]+)\]/g, '');
        pdf.setFont('courier', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(lyricsOnly, margin + 5, y);
        y += 5;
      } else {
        // Línea sin acordes
        pdf.setFont('courier', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(line, margin + 5, y);
        y += 5;
      }
    }
    
    return y;
  };


  // Renderizar cantos por categoría
  for (const category of sortedCategories) {
    const categorySongs = groupedSongs[category];
    
    // Ya no agregamos una página nueva para cada categoría
    // Solo verificamos si hay espacio suficiente
    checkNewPage(30);

    // Título de categoría con icono
    const icon = categoryIcons[category] || '🎵';
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138); // blue-900
    
    // Fondo de color para la categoría
    pdf.setFillColor(219, 234, 254); // blue-100
    pdf.roundedRect(margin, yPosition - 5, contentWidth, 12, 2, 2, 'F');
    
    pdf.text(`${icon} ${category}`, margin + 5, yPosition + 4);
    yPosition += 18;

    // Renderizar cada canto de la categoría
    for (let songIndex = 0; songIndex < categorySongs.length; songIndex++) {
      const song = categorySongs[songIndex];
      checkNewPage(40);

      // Cabecera del canto
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81); // gray-700
      
      // Fondo alternado para mejor lectura
      if (songIndex % 2 === 0) {
        pdf.setFillColor(249, 250, 251); // gray-50
        // Altura dinámica según si hay letra
        const bgHeight = song.lyrics ? Math.min(song.lyrics.split('\\n').length * 5 + 25, pageHeight - yPosition - margin) : 28;
        pdf.roundedRect(margin, yPosition - 3, contentWidth, bgHeight, 1, 1, 'F');
      }
      
      pdf.text(`${songIndex + 1}. ${song.title}`, margin + 3, yPosition + 3);
      yPosition += 8;

      // Autor
      if (song.author) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(107, 114, 128); // gray-500
        pdf.text(`Por: ${song.author}`, margin + 8, yPosition);
        yPosition += 6;
      }

      // Tonalidad original (si existe)
      if (song.originalKey) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(139, 92, 246); // purple-500
        pdf.text(`Tonalidad: ${song.originalKey}`, margin + 8, yPosition);
        yPosition += 6;
      }

      // Enlaces (YouTube y Partitura) - más pequeños
      pdf.setFontSize(8);
      pdf.setTextColor(59, 130, 246); // blue-500
      
      // El enlace apunta a la versión del instrumento con el que toca este coro
      // (el folleto ya se titula "Versión para Guitarra/Órgano" más arriba).
      const videoUrl = pickVideoUrl(song, userInstruments[0]);
      if (videoUrl) {
        pdf.textWithLink('🎬 Video', margin + 8, yPosition, {
          url: videoUrl
        });
        yPosition += 4;
      }

      if (song.sheetMusicUrl) {
        pdf.textWithLink('📄 Partitura', margin + 8, yPosition, {
          url: song.sheetMusicUrl
        });
        yPosition += 4;
      }

      yPosition += 3;

      // **LETRA DEL CANTO** — Sección 1: siempre letra con acordes (Guitarra y Órgano).
      // El instrumento solo afecta el orden de los cantos en las búsquedas, no el
      // formato del folleto. Las partituras van después, en la Sección 2.
      if (song.lyrics && song.lyrics.trim()) {
        checkNewPage(15);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 163, 74); // green-600
        pdf.text('Letra con acordes:', margin + 8, yPosition);
        yPosition += 6;

        yPosition = renderLyricsWithChords(song.lyrics, yPosition);

        yPosition += 5;
      } else {
        // Si no hay letra, agregar nota
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(156, 163, 175); // gray-400
        pdf.text('(Letra no disponible - ver video o partitura)', margin + 8, yPosition);
        yPosition += 6;
      }

      yPosition += 8; // Espacio entre cantos
    }

    // Espacio reducido entre categorías (no nueva página)
    yPosition += 5;
  }

  // ── Sección 2: Partituras (PDF de Drive) ordenadas por parte de la Misa ──
  // Solo en el folleto del Coro (embedScores). Va DESPUÉS de todas las letras con
  // acordes, en una sección aparte (mismo orden por categoría que la Sección 1).
  if (options.embedScores) {
    const onlyOrdinary = options.embedScores === 'ordinary';
    const include = (song: Song) => !!song.sheetMusicUrl && (!onlyOrdinary || isOrdinary(song));
    // ¿Hay alguna partitura que embeber? Si no, no agregamos la sección vacía.
    const hasAny = sortedCategories.some(cat => groupedSongs[cat].some(include));

    if (hasAny) {
      pdf.addPage();
      yPosition = margin;
      addLogo(8);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 138); // blue-900
      const secTitle = onlyOrdinary ? 'Partituras del ordinario' : 'Partituras';
      pdf.text(secTitle, (pageWidth - pdf.getTextWidth(secTitle)) / 2, yPosition);
      yPosition += 9;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128); // gray-500
      const secSub = onlyOrdinary
        ? 'Kyrie, Gloria, Santo, Cordero de Dios y Padre Nuestro'
        : 'Ordenadas por parte de la Misa';
      pdf.text(secSub, (pageWidth - pdf.getTextWidth(secSub)) / 2, yPosition);

      for (const category of sortedCategories) {
        for (const song of groupedSongs[category]) {
          if (include(song)) {
            await embedPartituraPages(pdf, song, { pageWidth, pageHeight, margin });
          }
        }
      }
    }
  }

  // Pie de página en la última página
  pdf.addPage();
  yPosition = margin + 40;

  // Logo pequeño
  addLogo(6);

  // Texto final
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 58, 138);
  const finalText = 'Cantoral Digital para Coros';
  const finalTextWidth = pdf.getTextWidth(finalText);
  pdf.text(finalText, (pageWidth - finalTextWidth) / 2, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  const appText = 'Generado con la aplicación de Cantorales Católicos';
  const appTextWidth = pdf.getTextWidth(appText);
  pdf.text(appText, (pageWidth - appTextWidth) / 2, yPosition);
  yPosition += 6;

  const dateGenerated = new Date().toLocaleDateString('es-ES');
  const dateGeneratedWidth = pdf.getTextWidth(dateGenerated);
  pdf.text(dateGenerated, (pageWidth - dateGeneratedWidth) / 2, yPosition);

  // Generar nombre de archivo y blob
  const fileName = `Folleto_Cantoral_${formatYmdForDisplay(date, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}.pdf`;
  const blob = pdf.output('blob');

  if (options.download !== false) {
    pdf.save(fileName);
  }

  return { blob, fileName };
};