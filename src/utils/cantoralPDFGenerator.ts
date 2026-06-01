import { jsPDF } from 'jspdf';
import { PublishedCantoral, Song } from '../types';

// Logo de la app en base64 (simple text logo for now)
const APP_NAME = '✝️ Cantoral Católico';
const APP_SUBTITLE = 'Cantos Litúrgicos';

interface PDFGeneratorOptions {
  cantoral: PublishedCantoral;
  includeChords?: boolean; // Para coros con guitarra
  includeSheetMusic?: boolean; // Para coros con órgano
}

export async function generateCantoralPDF(options: PDFGeneratorOptions): Promise<void> {
  const { cantoral, includeChords = false, includeSheetMusic = false } = options;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;
  let pageNumber = 1;

  // Función para agregar el membrete en cada página
  const addHeader = (isFirstPage = false) => {
    // Línea superior decorativa
    pdf.setDrawColor(41, 98, 255); // Azul
    pdf.setLineWidth(2);
    pdf.line(margin, 10, pageWidth - margin, 10);
    
    // Logo y nombre de la app
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 98, 255);
    pdf.text(APP_NAME, pageWidth / 2, 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(APP_SUBTITLE, pageWidth / 2, 24, { align: 'center' });
    
    // Línea inferior del membrete
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, 28, pageWidth - margin, 28);
    
    currentY = 35;
  };

  // Función para agregar el pie de página
  const addFooter = () => {
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'normal');
    
    // Información del cantoral en el pie
    const footerLeft = `${cantoral.parishName}`;
    const footerCenter = `${cantoral.liturgicalDate} - ${cantoral.massTime}`;
    const footerRight = `Pág. ${pageNumber}`;
    
    pdf.text(footerLeft, margin, pageHeight - 10);
    pdf.text(footerCenter, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(footerRight, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Función para verificar si necesitamos una nueva página
  const checkNewPage = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 25) {
      addFooter();
      pdf.addPage();
      pageNumber++;
      addHeader();
    }
  };

  // Primera página - Portada
  addHeader(true);
  
  // Título del cantoral
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(41, 98, 255);
  currentY = 60;
  pdf.text('Cantoral de la Misa', pageWidth / 2, currentY, { align: 'center' });
  
  // Fecha litúrgica
  currentY += 15;
  pdf.setFontSize(18);
  pdf.setTextColor(60, 60, 60);
  pdf.text(cantoral.liturgicalDate, pageWidth / 2, currentY, { align: 'center' });
  
  // Fecha y hora
  currentY += 12;
  pdf.setFontSize(14);
  const dateObj = new Date(cantoral.date);
  const formattedDate = dateObj.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(formattedDate, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 8;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(cantoral.massTime, pageWidth / 2, currentY, { align: 'center' });
  
  // Parroquia y coro
  currentY += 20;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  pdf.text(cantoral.parishName, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 7;
  pdf.text(`Coro: ${cantoral.choirName}`, pageWidth / 2, currentY, { align: 'center' });
  
  // Decoración
  currentY += 15;
  pdf.setDrawColor(41, 98, 255);
  pdf.setLineWidth(1);
  pdf.line(pageWidth / 2 - 30, currentY, pageWidth / 2 + 30, currentY);
  
  // Icono o símbolo
  currentY += 20;
  pdf.setFontSize(48);
  pdf.text('🎵', pageWidth / 2, currentY, { align: 'center' });
  
  // Pie de primera página
  addFooter();
  
  // Segunda página - Índice
  pdf.addPage();
  pageNumber++;
  addHeader();
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(41, 98, 255);
  pdf.text('Índice de Cantos', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 12;
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;
  
  // Agrupar cantos por categoría
  const categoryOrder = ['Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio', 'Ofertorio', 'Santo', 'Cordero de Dios', 'Comunión', 'Salida'];
  const songsByCategory = cantoral.songs.reduce((acc, song) => {
    if (!acc[song.category]) {
      acc[song.category] = [];
    }
    acc[song.category].push(song);
    return acc;
  }, {} as Record<string, Song[]>);
  
  const sortedCategories = Object.keys(songsByCategory).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });
  
  sortedCategories.forEach((category, index) => {
    checkNewPage(15);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(41, 98, 255);
    pdf.text(`${category}`, margin, currentY);
    currentY += 6;
    
    songsByCategory[category].forEach((song) => {
      checkNewPage(10);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      pdf.text(`• ${song.title}`, margin + 5, currentY);
      
      if (song.author) {
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`(${song.author})`, margin + 10, currentY + 4);
        currentY += 5;
      }
      
      currentY += 6;
    });
    
    currentY += 3;
  });
  
  addFooter();
  
  // Páginas de cantos
  sortedCategories.forEach((category, categoryIndex) => {
    // Solo agregamos nueva página para la primera categoría (después del índice)
    if (categoryIndex === 0) {
      pdf.addPage();
      pageNumber++;
      addHeader();
    }
    
    songsByCategory[category].forEach((song, songIndex) => {
      // Ya no agregamos una página nueva para cada canto
      // Solo verificamos si hay espacio suficiente
      checkNewPage(50);
      
      // Categoría del canto (solo mostrar para el primer canto de cada categoría)
      if (songIndex === 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(41, 98, 255);
        pdf.text(category.toUpperCase(), margin, currentY);
        currentY += 8;
      }
      
      // Título del canto
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(41, 98, 255);
      pdf.text(song.title, margin, currentY);
      currentY += 8;
      
      // Autor
      if (song.author) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Autor: ${song.author}`, margin, currentY);
        currentY += 6;
      }
      
      // Tonalidad si está disponible
      if (song.originalKey) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Tonalidad: ${song.originalKey}`, margin, currentY);
        currentY += 6;
      }
      
      currentY += 3;
      
      // Línea separadora
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
      
      // Letra del canto
      if (song.lyrics) {
        pdf.setFontSize(11);
        pdf.setFont('courier', 'normal'); // Courier para mejor visualización de acordes
        pdf.setTextColor(40, 40, 40);
        
        const lines = song.lyrics.split('\n');
        
        lines.forEach((line) => {
          checkNewPage(6);
          
          // Si la línea contiene acordes (líneas que empiezan con espacios o tienen caracteres de acordes)
          const isChordLine = /^[\s]*[A-G][#b]?[m]?[0-9]?[\/]?/.test(line);
          
          if (isChordLine && includeChords) {
            pdf.setFont('courier', 'bold');
            pdf.setTextColor(200, 50, 50); // Rojo para acordes
            pdf.text(line, margin, currentY);
          } else if (isChordLine && !includeChords) {
            // Omitir líneas de acordes si no se incluyen
            return;
          } else {
            pdf.setFont('courier', 'normal');
            pdf.setTextColor(40, 40, 40);
            pdf.text(line, margin, currentY);
          }
          
          currentY += 5;
        });
      } else {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Letra no disponible en el sistema', margin, currentY);
        currentY += 8;
      }
      
      // Nota sobre partitura
      if (song.sheetMusicUrl && includeSheetMusic) {
        currentY += 5;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('📄 Partitura disponible - Consulta en la app o descarga desde YouTube', margin, currentY);
        currentY += 5;
      }
      
      // Espacio entre cantos
      currentY += 10;
    });
    
    // Espacio pequeño entre categorías
    currentY += 5;
  });
  
  // Agregar footer después de todos los cantos
  addFooter();
  
  // Última página - Información adicional
  pdf.addPage();
  pageNumber++;
  addHeader();
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(41, 98, 255);
  pdf.text('Notas', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 80);
  
  const notes = [
    '• Este cantoral fue generado automáticamente desde la app Cantoral Católico.',
    '',
    '• Todos los cantos incluyen enlaces a videos de YouTube donde puedes escuchar',
    '  las versiones completas con acompañamiento.',
    '',
    '• Para acceder a las partituras completas y audios, descarga la app.',
    '',
    '• Este documento es para uso litúrgico en tu parroquia.',
  ];
  
  notes.forEach((note) => {
    checkNewPage(6);
    if (note) {
      pdf.text(note, margin, currentY);
    }
    currentY += 6;
  });
  
  addFooter();
  
  // Guardar el PDF
  const fileName = `Cantoral_${cantoral.parishName.replace(/\s+/g, '_')}_${cantoral.liturgicalDate.replace(/\s+/g, '_')}.pdf`;
  pdf.save(fileName);
}