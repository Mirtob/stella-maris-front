import type { VercelRequest, VercelResponse } from '@vercel/node';
// Calendario base INLINE — GENERADO: no editar a mano. Sale de
// src/data/liturgicalCalendar.generated.json con `npm run gen:calendar` (que llama a
// scripts/genCronCelebrations.mjs). Va inline y no como import porque en este setup de
// Vercel las funciones deben ser autocontenidas: importar un modulo hermano (.ts o
// .json) crashea la funcion al cargar (FUNCTION_INVOCATION_FAILED).
//
// La regla es TODO domingo + toda solemnidad. Cuando esta copia se mantenia a mano se
// desfaso: le faltaban los 23 domingos que caen en una FIESTA (Sagrada Familia,
// Bautismo del Senor, Presentacion...), y en esos domingos el coro se quedaba sin el
// recordatorio del jueves sin que nada diera error.
const BASE_CELEBRATIONS: { date: string; name: string; solemne?: boolean }[] = [
  { date: "2024-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2024-01-07", name: "Epifanía del Señor", solemne: true },
  { date: "2024-01-14", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2024-01-21", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2024-01-28", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2024-02-04", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2024-02-11", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2024-02-18", name: "1.º Domingo de Cuaresma" },
  { date: "2024-02-25", name: "2.º Domingo de Cuaresma" },
  { date: "2024-03-03", name: "3.º Domingo de Cuaresma" },
  { date: "2024-03-10", name: "4.º Domingo de Cuaresma" },
  { date: "2024-03-17", name: "5.º Domingo de Cuaresma" },
  { date: "2024-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2024-03-24", name: "Domingo de Ramos" },
  { date: "2024-03-31", name: "Domingo de Resurrección", solemne: true },
  { date: "2024-04-01", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2024-04-02", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2024-04-03", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2024-04-04", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2024-04-05", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2024-04-06", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2024-04-07", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2024-04-08", name: "Anunciación del Señor", solemne: true },
  { date: "2024-04-14", name: "3.º Domingo de Pascua" },
  { date: "2024-04-21", name: "4.º Domingo de Pascua" },
  { date: "2024-04-28", name: "5.º Domingo de Pascua" },
  { date: "2024-05-05", name: "6.º Domingo de Pascua" },
  { date: "2024-05-09", name: "Ascensión del Señor", solemne: true },
  { date: "2024-05-12", name: "7.º Domingo de Pascua" },
  { date: "2024-05-19", name: "Pentecostés", solemne: true },
  { date: "2024-05-26", name: "Santísima Trinidad", solemne: true },
  { date: "2024-06-02", name: "Corpus Christi", solemne: true },
  { date: "2024-06-07", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2024-06-09", name: "10.º Domingo del Tiempo Ordinario" },
  { date: "2024-06-16", name: "11.º Domingo del Tiempo Ordinario" },
  { date: "2024-06-23", name: "12.º Domingo del Tiempo Ordinario" },
  { date: "2024-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2024-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2024-06-30", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2024-07-07", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2024-07-14", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2024-07-21", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2024-07-28", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2024-08-04", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2024-08-11", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2024-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2024-08-18", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2024-08-25", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2024-09-01", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2024-09-08", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2024-09-15", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2024-09-22", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2024-09-29", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2024-10-06", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2024-10-13", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2024-10-20", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2024-10-27", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2024-11-01", name: "Todos los Santos", solemne: true },
  { date: "2024-11-03", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2024-11-10", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2024-11-17", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2024-11-24", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2024-12-01", name: "1.º Domingo de Adviento" },
  { date: "2024-12-08", name: "2.º Domingo de Adviento" },
  { date: "2024-12-09", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2024-12-15", name: "3.º Domingo de Adviento" },
  { date: "2024-12-22", name: "4.º Domingo de Adviento" },
  { date: "2024-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2024-12-29", name: "Sagrada Familia" },
  { date: "2025-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2025-01-05", name: "Epifanía del Señor", solemne: true },
  { date: "2025-01-12", name: "Bautismo del Señor" },
  { date: "2025-01-19", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2025-01-26", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2025-02-02", name: "Presentación del Señor" },
  { date: "2025-02-09", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2025-02-16", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2025-02-23", name: "7.º Domingo del Tiempo Ordinario" },
  { date: "2025-03-02", name: "8.º Domingo del Tiempo Ordinario" },
  { date: "2025-03-09", name: "1.º Domingo de Cuaresma" },
  { date: "2025-03-16", name: "2.º Domingo de Cuaresma" },
  { date: "2025-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2025-03-23", name: "3.º Domingo de Cuaresma" },
  { date: "2025-03-25", name: "Anunciación del Señor", solemne: true },
  { date: "2025-03-30", name: "4.º Domingo de Cuaresma" },
  { date: "2025-04-06", name: "5.º Domingo de Cuaresma" },
  { date: "2025-04-13", name: "Domingo de Ramos" },
  { date: "2025-04-20", name: "Domingo de Resurrección", solemne: true },
  { date: "2025-04-21", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2025-04-22", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2025-04-23", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2025-04-24", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2025-04-25", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2025-04-26", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2025-04-27", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2025-05-04", name: "3.º Domingo de Pascua" },
  { date: "2025-05-11", name: "4.º Domingo de Pascua" },
  { date: "2025-05-18", name: "5.º Domingo de Pascua" },
  { date: "2025-05-25", name: "6.º Domingo de Pascua" },
  { date: "2025-05-29", name: "Ascensión del Señor", solemne: true },
  { date: "2025-06-01", name: "7.º Domingo de Pascua" },
  { date: "2025-06-08", name: "Pentecostés", solemne: true },
  { date: "2025-06-15", name: "Santísima Trinidad", solemne: true },
  { date: "2025-06-22", name: "Corpus Christi", solemne: true },
  { date: "2025-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2025-06-27", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2025-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2025-07-06", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2025-07-13", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2025-07-20", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2025-07-27", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2025-08-03", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2025-08-10", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2025-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2025-08-17", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2025-08-24", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2025-08-31", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2025-09-07", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2025-09-14", name: "The Exaltation of the Holy Cross" },
  { date: "2025-09-21", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2025-09-28", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2025-10-05", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2025-10-12", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2025-10-19", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2025-10-26", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2025-11-01", name: "Todos los Santos", solemne: true },
  { date: "2025-11-02", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2025-11-09", name: "Dedication of the Lateran Basilica" },
  { date: "2025-11-16", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2025-11-23", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2025-11-30", name: "1.º Domingo de Adviento" },
  { date: "2025-12-07", name: "2.º Domingo de Adviento" },
  { date: "2025-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2025-12-14", name: "3.º Domingo de Adviento" },
  { date: "2025-12-21", name: "4.º Domingo de Adviento" },
  { date: "2025-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2025-12-28", name: "Sagrada Familia" },
  { date: "2026-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2026-01-04", name: "Epifanía del Señor", solemne: true },
  { date: "2026-01-11", name: "Bautismo del Señor" },
  { date: "2026-01-18", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2026-01-25", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2026-02-01", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2026-02-08", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2026-02-15", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2026-02-22", name: "1.º Domingo de Cuaresma" },
  { date: "2026-03-01", name: "2.º Domingo de Cuaresma" },
  { date: "2026-03-08", name: "3.º Domingo de Cuaresma" },
  { date: "2026-03-15", name: "4.º Domingo de Cuaresma" },
  { date: "2026-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2026-03-22", name: "5.º Domingo de Cuaresma" },
  { date: "2026-03-25", name: "Anunciación del Señor", solemne: true },
  { date: "2026-03-29", name: "Domingo de Ramos" },
  { date: "2026-04-05", name: "Domingo de Resurrección", solemne: true },
  { date: "2026-04-06", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2026-04-07", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2026-04-08", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2026-04-09", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2026-04-10", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2026-04-11", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2026-04-12", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2026-04-19", name: "3.º Domingo de Pascua" },
  { date: "2026-04-26", name: "4.º Domingo de Pascua" },
  { date: "2026-05-03", name: "5.º Domingo de Pascua" },
  { date: "2026-05-10", name: "6.º Domingo de Pascua" },
  { date: "2026-05-14", name: "Ascensión del Señor", solemne: true },
  { date: "2026-05-17", name: "7.º Domingo de Pascua" },
  { date: "2026-05-24", name: "Pentecostés", solemne: true },
  { date: "2026-05-31", name: "Santísima Trinidad", solemne: true },
  { date: "2026-06-07", name: "Corpus Christi", solemne: true },
  { date: "2026-06-12", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2026-06-14", name: "11.º Domingo del Tiempo Ordinario" },
  { date: "2026-06-21", name: "12.º Domingo del Tiempo Ordinario" },
  { date: "2026-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2026-06-28", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2026-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2026-07-05", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2026-07-12", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2026-07-19", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2026-07-26", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2026-08-02", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2026-08-09", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2026-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2026-08-16", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2026-08-23", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2026-08-30", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2026-09-06", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2026-09-13", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2026-09-20", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2026-09-27", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2026-10-04", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2026-10-11", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2026-10-18", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2026-10-25", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2026-11-01", name: "Todos los Santos", solemne: true },
  { date: "2026-11-08", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2026-11-15", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2026-11-22", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2026-11-29", name: "1.º Domingo de Adviento" },
  { date: "2026-12-06", name: "2.º Domingo de Adviento" },
  { date: "2026-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2026-12-13", name: "3.º Domingo de Adviento" },
  { date: "2026-12-20", name: "4.º Domingo de Adviento" },
  { date: "2026-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2026-12-27", name: "Sagrada Familia" },
  { date: "2027-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2027-01-03", name: "Epifanía del Señor", solemne: true },
  { date: "2027-01-10", name: "Bautismo del Señor" },
  { date: "2027-01-17", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2027-01-24", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2027-01-31", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2027-02-07", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2027-02-14", name: "1.º Domingo de Cuaresma" },
  { date: "2027-02-21", name: "2.º Domingo de Cuaresma" },
  { date: "2027-02-28", name: "3.º Domingo de Cuaresma" },
  { date: "2027-03-07", name: "4.º Domingo de Cuaresma" },
  { date: "2027-03-14", name: "5.º Domingo de Cuaresma" },
  { date: "2027-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2027-03-21", name: "Domingo de Ramos" },
  { date: "2027-03-28", name: "Domingo de Resurrección", solemne: true },
  { date: "2027-03-29", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2027-03-30", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2027-03-31", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2027-04-01", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2027-04-02", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2027-04-03", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2027-04-04", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2027-04-05", name: "Anunciación del Señor", solemne: true },
  { date: "2027-04-11", name: "3.º Domingo de Pascua" },
  { date: "2027-04-18", name: "4.º Domingo de Pascua" },
  { date: "2027-04-25", name: "5.º Domingo de Pascua" },
  { date: "2027-05-02", name: "6.º Domingo de Pascua" },
  { date: "2027-05-06", name: "Ascensión del Señor", solemne: true },
  { date: "2027-05-09", name: "7.º Domingo de Pascua" },
  { date: "2027-05-16", name: "Pentecostés", solemne: true },
  { date: "2027-05-23", name: "Santísima Trinidad", solemne: true },
  { date: "2027-05-30", name: "Corpus Christi", solemne: true },
  { date: "2027-06-04", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2027-06-06", name: "10.º Domingo del Tiempo Ordinario" },
  { date: "2027-06-13", name: "11.º Domingo del Tiempo Ordinario" },
  { date: "2027-06-20", name: "12.º Domingo del Tiempo Ordinario" },
  { date: "2027-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2027-06-27", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2027-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2027-07-04", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2027-07-11", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2027-07-18", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2027-07-25", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2027-08-01", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2027-08-08", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2027-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2027-08-22", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2027-08-29", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2027-09-05", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2027-09-12", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2027-09-19", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2027-09-26", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2027-10-03", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2027-10-10", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2027-10-17", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2027-10-24", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2027-10-31", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2027-11-01", name: "Todos los Santos", solemne: true },
  { date: "2027-11-07", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2027-11-14", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2027-11-21", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2027-11-28", name: "1.º Domingo de Adviento" },
  { date: "2027-12-05", name: "2.º Domingo de Adviento" },
  { date: "2027-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2027-12-12", name: "3.º Domingo de Adviento" },
  { date: "2027-12-19", name: "4.º Domingo de Adviento" },
  { date: "2027-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2027-12-26", name: "Sagrada Familia" },
  { date: "2028-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2028-01-02", name: "Epifanía del Señor", solemne: true },
  { date: "2028-01-09", name: "Bautismo del Señor" },
  { date: "2028-01-16", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2028-01-23", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2028-01-30", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2028-02-06", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2028-02-13", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2028-02-20", name: "7.º Domingo del Tiempo Ordinario" },
  { date: "2028-02-27", name: "8.º Domingo del Tiempo Ordinario" },
  { date: "2028-03-05", name: "1.º Domingo de Cuaresma" },
  { date: "2028-03-12", name: "2.º Domingo de Cuaresma" },
  { date: "2028-03-19", name: "3.º Domingo de Cuaresma" },
  { date: "2028-03-20", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2028-03-25", name: "Anunciación del Señor", solemne: true },
  { date: "2028-03-26", name: "4.º Domingo de Cuaresma" },
  { date: "2028-04-02", name: "5.º Domingo de Cuaresma" },
  { date: "2028-04-09", name: "Domingo de Ramos" },
  { date: "2028-04-16", name: "Domingo de Resurrección", solemne: true },
  { date: "2028-04-17", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2028-04-18", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2028-04-19", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2028-04-20", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2028-04-21", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2028-04-22", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2028-04-23", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2028-04-30", name: "3.º Domingo de Pascua" },
  { date: "2028-05-07", name: "4.º Domingo de Pascua" },
  { date: "2028-05-14", name: "5.º Domingo de Pascua" },
  { date: "2028-05-21", name: "6.º Domingo de Pascua" },
  { date: "2028-05-25", name: "Ascensión del Señor", solemne: true },
  { date: "2028-05-28", name: "7.º Domingo de Pascua" },
  { date: "2028-06-04", name: "Pentecostés", solemne: true },
  { date: "2028-06-11", name: "Santísima Trinidad", solemne: true },
  { date: "2028-06-18", name: "Corpus Christi", solemne: true },
  { date: "2028-06-23", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2028-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2028-06-25", name: "12.º Domingo del Tiempo Ordinario" },
  { date: "2028-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2028-07-02", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2028-07-09", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2028-07-16", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2028-07-23", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2028-07-30", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2028-08-06", name: "Transfiguración del Señor" },
  { date: "2028-08-13", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2028-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2028-08-20", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2028-08-27", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2028-09-03", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2028-09-10", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2028-09-17", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2028-09-24", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2028-10-01", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2028-10-08", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2028-10-15", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2028-10-22", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2028-10-29", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2028-11-01", name: "Todos los Santos", solemne: true },
  { date: "2028-11-05", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2028-11-12", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2028-11-19", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2028-11-26", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2028-12-03", name: "1.º Domingo de Adviento" },
  { date: "2028-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2028-12-10", name: "2.º Domingo de Adviento" },
  { date: "2028-12-17", name: "3.º Domingo de Adviento" },
  { date: "2028-12-24", name: "4.º Domingo de Adviento" },
  { date: "2028-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2028-12-31", name: "Sagrada Familia" },
  { date: "2029-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2029-01-07", name: "Epifanía del Señor", solemne: true },
  { date: "2029-01-14", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2029-01-21", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2029-01-28", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2029-02-04", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2029-02-11", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2029-02-18", name: "1.º Domingo de Cuaresma" },
  { date: "2029-02-25", name: "2.º Domingo de Cuaresma" },
  { date: "2029-03-04", name: "3.º Domingo de Cuaresma" },
  { date: "2029-03-11", name: "4.º Domingo de Cuaresma" },
  { date: "2029-03-18", name: "5.º Domingo de Cuaresma" },
  { date: "2029-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2029-03-25", name: "Domingo de Ramos" },
  { date: "2029-04-01", name: "Domingo de Resurrección", solemne: true },
  { date: "2029-04-02", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2029-04-03", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2029-04-04", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2029-04-05", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2029-04-06", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2029-04-07", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2029-04-08", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2029-04-09", name: "Anunciación del Señor", solemne: true },
  { date: "2029-04-15", name: "3.º Domingo de Pascua" },
  { date: "2029-04-22", name: "4.º Domingo de Pascua" },
  { date: "2029-04-29", name: "5.º Domingo de Pascua" },
  { date: "2029-05-06", name: "6.º Domingo de Pascua" },
  { date: "2029-05-10", name: "Ascensión del Señor", solemne: true },
  { date: "2029-05-13", name: "7.º Domingo de Pascua" },
  { date: "2029-05-20", name: "Pentecostés", solemne: true },
  { date: "2029-05-27", name: "Santísima Trinidad", solemne: true },
  { date: "2029-06-03", name: "Corpus Christi", solemne: true },
  { date: "2029-06-08", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2029-06-10", name: "10.º Domingo del Tiempo Ordinario" },
  { date: "2029-06-17", name: "11.º Domingo del Tiempo Ordinario" },
  { date: "2029-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2029-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2029-07-01", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2029-07-08", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2029-07-15", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2029-07-22", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2029-07-29", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2029-08-05", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2029-08-12", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2029-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2029-08-19", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2029-08-26", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2029-09-02", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2029-09-09", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2029-09-16", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2029-09-23", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2029-09-30", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2029-10-07", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2029-10-14", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2029-10-21", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2029-10-28", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2029-11-01", name: "Todos los Santos", solemne: true },
  { date: "2029-11-04", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2029-11-11", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2029-11-18", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2029-11-25", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2029-12-02", name: "1.º Domingo de Adviento" },
  { date: "2029-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2029-12-09", name: "2.º Domingo de Adviento" },
  { date: "2029-12-16", name: "3.º Domingo de Adviento" },
  { date: "2029-12-23", name: "4.º Domingo de Adviento" },
  { date: "2029-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2029-12-30", name: "Sagrada Familia" },
  { date: "2030-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2030-01-06", name: "Epifanía del Señor", solemne: true },
  { date: "2030-01-13", name: "Bautismo del Señor" },
  { date: "2030-01-20", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2030-01-27", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2030-02-03", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2030-02-10", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2030-02-17", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2030-02-24", name: "7.º Domingo del Tiempo Ordinario" },
  { date: "2030-03-03", name: "8.º Domingo del Tiempo Ordinario" },
  { date: "2030-03-10", name: "1.º Domingo de Cuaresma" },
  { date: "2030-03-17", name: "2.º Domingo de Cuaresma" },
  { date: "2030-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2030-03-24", name: "3.º Domingo de Cuaresma" },
  { date: "2030-03-25", name: "Anunciación del Señor", solemne: true },
  { date: "2030-03-31", name: "4.º Domingo de Cuaresma" },
  { date: "2030-04-07", name: "5.º Domingo de Cuaresma" },
  { date: "2030-04-14", name: "Domingo de Ramos" },
  { date: "2030-04-21", name: "Domingo de Resurrección", solemne: true },
  { date: "2030-04-22", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2030-04-23", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2030-04-24", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2030-04-25", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2030-04-26", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2030-04-27", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2030-04-28", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2030-05-05", name: "3.º Domingo de Pascua" },
  { date: "2030-05-12", name: "4.º Domingo de Pascua" },
  { date: "2030-05-19", name: "5.º Domingo de Pascua" },
  { date: "2030-05-26", name: "6.º Domingo de Pascua" },
  { date: "2030-05-30", name: "Ascensión del Señor", solemne: true },
  { date: "2030-06-02", name: "7.º Domingo de Pascua" },
  { date: "2030-06-09", name: "Pentecostés", solemne: true },
  { date: "2030-06-16", name: "Santísima Trinidad", solemne: true },
  { date: "2030-06-23", name: "Corpus Christi", solemne: true },
  { date: "2030-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2030-06-28", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2030-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2030-06-30", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2030-07-07", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2030-07-14", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2030-07-21", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2030-07-28", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2030-08-04", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2030-08-11", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2030-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2030-08-18", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2030-08-25", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2030-09-01", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2030-09-08", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2030-09-15", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2030-09-22", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2030-09-29", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2030-10-06", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2030-10-13", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2030-10-20", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2030-10-27", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2030-11-01", name: "Todos los Santos", solemne: true },
  { date: "2030-11-03", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2030-11-10", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2030-11-17", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2030-11-24", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2030-12-01", name: "1.º Domingo de Adviento" },
  { date: "2030-12-08", name: "2.º Domingo de Adviento" },
  { date: "2030-12-09", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2030-12-15", name: "3.º Domingo de Adviento" },
  { date: "2030-12-22", name: "4.º Domingo de Adviento" },
  { date: "2030-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2030-12-29", name: "Sagrada Familia" },
  { date: "2031-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2031-01-05", name: "Epifanía del Señor", solemne: true },
  { date: "2031-01-12", name: "Bautismo del Señor" },
  { date: "2031-01-19", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2031-01-26", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2031-02-02", name: "Presentación del Señor" },
  { date: "2031-02-09", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2031-02-16", name: "6.º Domingo del Tiempo Ordinario" },
  { date: "2031-02-23", name: "7.º Domingo del Tiempo Ordinario" },
  { date: "2031-03-02", name: "1.º Domingo de Cuaresma" },
  { date: "2031-03-09", name: "2.º Domingo de Cuaresma" },
  { date: "2031-03-16", name: "3.º Domingo de Cuaresma" },
  { date: "2031-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2031-03-23", name: "4.º Domingo de Cuaresma" },
  { date: "2031-03-25", name: "Anunciación del Señor", solemne: true },
  { date: "2031-03-30", name: "5.º Domingo de Cuaresma" },
  { date: "2031-04-06", name: "Domingo de Ramos" },
  { date: "2031-04-13", name: "Domingo de Resurrección", solemne: true },
  { date: "2031-04-14", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2031-04-15", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2031-04-16", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2031-04-17", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2031-04-18", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2031-04-19", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2031-04-20", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2031-04-27", name: "3.º Domingo de Pascua" },
  { date: "2031-05-04", name: "4.º Domingo de Pascua" },
  { date: "2031-05-11", name: "5.º Domingo de Pascua" },
  { date: "2031-05-18", name: "6.º Domingo de Pascua" },
  { date: "2031-05-22", name: "Ascensión del Señor", solemne: true },
  { date: "2031-05-25", name: "7.º Domingo de Pascua" },
  { date: "2031-06-01", name: "Pentecostés", solemne: true },
  { date: "2031-06-08", name: "Santísima Trinidad", solemne: true },
  { date: "2031-06-15", name: "Corpus Christi", solemne: true },
  { date: "2031-06-20", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2031-06-22", name: "12.º Domingo del Tiempo Ordinario" },
  { date: "2031-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2031-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2031-07-06", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2031-07-13", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2031-07-20", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2031-07-27", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2031-08-03", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2031-08-10", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2031-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2031-08-17", name: "20.º Domingo del Tiempo Ordinario" },
  { date: "2031-08-24", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2031-08-31", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2031-09-07", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2031-09-14", name: "The Exaltation of the Holy Cross" },
  { date: "2031-09-21", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2031-09-28", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2031-10-05", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2031-10-12", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2031-10-19", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2031-10-26", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2031-11-01", name: "Todos los Santos", solemne: true },
  { date: "2031-11-02", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2031-11-09", name: "Dedication of the Lateran Basilica" },
  { date: "2031-11-16", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2031-11-23", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2031-11-30", name: "1.º Domingo de Adviento" },
  { date: "2031-12-07", name: "2.º Domingo de Adviento" },
  { date: "2031-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2031-12-14", name: "3.º Domingo de Adviento" },
  { date: "2031-12-21", name: "4.º Domingo de Adviento" },
  { date: "2031-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2031-12-28", name: "Sagrada Familia" },
  { date: "2032-01-01", name: "Santa María, Madre de Dios", solemne: true },
  { date: "2032-01-04", name: "Epifanía del Señor", solemne: true },
  { date: "2032-01-11", name: "Bautismo del Señor" },
  { date: "2032-01-18", name: "2.º Domingo del Tiempo Ordinario" },
  { date: "2032-01-25", name: "3.º Domingo del Tiempo Ordinario" },
  { date: "2032-02-01", name: "4.º Domingo del Tiempo Ordinario" },
  { date: "2032-02-08", name: "5.º Domingo del Tiempo Ordinario" },
  { date: "2032-02-15", name: "1.º Domingo de Cuaresma" },
  { date: "2032-02-22", name: "2.º Domingo de Cuaresma" },
  { date: "2032-02-29", name: "3.º Domingo de Cuaresma" },
  { date: "2032-03-07", name: "4.º Domingo de Cuaresma" },
  { date: "2032-03-14", name: "5.º Domingo de Cuaresma" },
  { date: "2032-03-19", name: "San José, Esposo de la Virgen María", solemne: true },
  { date: "2032-03-21", name: "Domingo de Ramos" },
  { date: "2032-03-28", name: "Domingo de Resurrección", solemne: true },
  { date: "2032-03-29", name: "Lunes de la Octava de Pascua", solemne: true },
  { date: "2032-03-30", name: "Martes de la Octava de Pascua", solemne: true },
  { date: "2032-03-31", name: "Miércoles de la Octava de Pascua", solemne: true },
  { date: "2032-04-01", name: "Jueves de la Octava de Pascua", solemne: true },
  { date: "2032-04-02", name: "Viernes de la Octava de Pascua", solemne: true },
  { date: "2032-04-03", name: "Sábado de la Octava de Pascua", solemne: true },
  { date: "2032-04-04", name: "Domingo de la Divina Misericordia (2.º de Pascua)", solemne: true },
  { date: "2032-04-05", name: "Anunciación del Señor", solemne: true },
  { date: "2032-04-11", name: "3.º Domingo de Pascua" },
  { date: "2032-04-18", name: "4.º Domingo de Pascua" },
  { date: "2032-04-25", name: "5.º Domingo de Pascua" },
  { date: "2032-05-02", name: "6.º Domingo de Pascua" },
  { date: "2032-05-06", name: "Ascensión del Señor", solemne: true },
  { date: "2032-05-09", name: "7.º Domingo de Pascua" },
  { date: "2032-05-16", name: "Pentecostés", solemne: true },
  { date: "2032-05-23", name: "Santísima Trinidad", solemne: true },
  { date: "2032-05-30", name: "Corpus Christi", solemne: true },
  { date: "2032-06-04", name: "Sagrado Corazón de Jesús", solemne: true },
  { date: "2032-06-06", name: "10.º Domingo del Tiempo Ordinario" },
  { date: "2032-06-13", name: "11.º Domingo del Tiempo Ordinario" },
  { date: "2032-06-20", name: "12.º Domingo del Tiempo Ordinario" },
  { date: "2032-06-24", name: "Natividad de San Juan Bautista", solemne: true },
  { date: "2032-06-27", name: "13.º Domingo del Tiempo Ordinario" },
  { date: "2032-06-29", name: "San Pedro y San Pablo, Apóstoles", solemne: true },
  { date: "2032-07-04", name: "14.º Domingo del Tiempo Ordinario" },
  { date: "2032-07-11", name: "15.º Domingo del Tiempo Ordinario" },
  { date: "2032-07-18", name: "16.º Domingo del Tiempo Ordinario" },
  { date: "2032-07-25", name: "17.º Domingo del Tiempo Ordinario" },
  { date: "2032-08-01", name: "18.º Domingo del Tiempo Ordinario" },
  { date: "2032-08-08", name: "19.º Domingo del Tiempo Ordinario" },
  { date: "2032-08-15", name: "Asunción de la Virgen María", solemne: true },
  { date: "2032-08-22", name: "21.º Domingo del Tiempo Ordinario" },
  { date: "2032-08-29", name: "22.º Domingo del Tiempo Ordinario" },
  { date: "2032-09-05", name: "23.º Domingo del Tiempo Ordinario" },
  { date: "2032-09-12", name: "24.º Domingo del Tiempo Ordinario" },
  { date: "2032-09-19", name: "25.º Domingo del Tiempo Ordinario" },
  { date: "2032-09-26", name: "26.º Domingo del Tiempo Ordinario" },
  { date: "2032-10-03", name: "27.º Domingo del Tiempo Ordinario" },
  { date: "2032-10-10", name: "28.º Domingo del Tiempo Ordinario" },
  { date: "2032-10-17", name: "29.º Domingo del Tiempo Ordinario" },
  { date: "2032-10-24", name: "30.º Domingo del Tiempo Ordinario" },
  { date: "2032-10-31", name: "31.º Domingo del Tiempo Ordinario" },
  { date: "2032-11-01", name: "Todos los Santos", solemne: true },
  { date: "2032-11-07", name: "32.º Domingo del Tiempo Ordinario" },
  { date: "2032-11-14", name: "33.º Domingo del Tiempo Ordinario" },
  { date: "2032-11-21", name: "Jesucristo, Rey del Universo", solemne: true },
  { date: "2032-11-28", name: "1.º Domingo de Adviento" },
  { date: "2032-12-05", name: "2.º Domingo de Adviento" },
  { date: "2032-12-08", name: "Inmaculada Concepción de la Virgen María", solemne: true },
  { date: "2032-12-12", name: "3.º Domingo de Adviento" },
  { date: "2032-12-19", name: "4.º Domingo de Adviento" },
  { date: "2032-12-25", name: "Natividad del Señor", solemne: true },
  { date: "2032-12-26", name: "Sagrada Familia" },
];

// Las funciones puras de fecha y de texto van EXPORTADAS para poder probarlas desde
// tests/unit/avisos-automaticos.test.ts. Vercel solo usa el `export default` (el
// handler); exportar además estas no cambia nada del despliegue.
//
// Cron DIARIO a las 14:00 UTC (= 10:00 de Chile en invierno UTC−4; 11:00 en verano
// UTC−3, porque los crons de Vercel son SOLO en UTC y Chile cambia de horario). El
// aviso al coro del domingo cae en la corrida del JUEVES (domingo − 3 = jueves), o sea
// ~10:00 hora chilena los jueves. Dos tipos de aviso:
//  1) Recordatorio general (7 y 1 día antes) → a todos los suscriptores con topic
//     'celebrations': las celebraciones PERSONALIZADAS de la parroquia y las
//     SOLEMNIDADES del calendario. Los domingos corrientes NO avisan (serían 52 al año
//     y la gente terminaría ignorando las notificaciones); tampoco los días de la
//     Octava de Pascua, que son solemnidades de rango pero seis seguidas.
//  2) Recordatorio al CORO/ADMIN (3 días antes) de celebraciones POR DEFECTO (calendario:
//     domingos + solemnidades) y AGREGADAS, "publica el cantoral si no lo has hecho":
//     a suscriptores con role IN ('Coro','Admin'), por parroquia, y SOLO si esa parroquia
//     aún no tiene un cantoral publicado para esa fecha.
//
// AUTOCONTENIDO (sin imports de api/_*). El calendario base va como MÓDULO .ts
// (api/baseCelebrations.ts) — NO como .json: el import de JSON en ESM de Vercel exige
// import assertions y crashea al cargar. web-push se carga con dynamic import.

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = (process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC).trim();
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').trim();
const VAPID_SUBJECT = (process.env.VAPID_SUBJECT || 'mailto:gustavus.tobar@gmail.com').trim();

const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };

export function todayInSantiago(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
}
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
export const leadLabel = (lead: number) => (lead === 1 ? 'mañana' : `en ${lead} días`);
const encParish = (p: string) => encodeURIComponent(`{"${p.replace(/"/g, '\\"')}"}`);

/** Celebraciones "por defecto" en una fecha: domingos + solemnidades (a todas las parroquias). */
export function baseCelebrationsOn(date: string): string[] {
  return BASE_CELEBRATIONS.filter((e) => e.date === date).map((e) => e.name);
}

/**
 * Días de la Octava de Pascua (lunes a sábado). Son solemnidades por rango litúrgico,
 * pero NO se avisan: son seis seguidas y, con las ventanas de 7 y 1 día, generaban
 * catorce días seguidos de notificaciones en torno a Semana Santa. Nadie necesita un
 * aviso que diga "mañana es Martes de la Octava de Pascua". El Domingo de Resurrección
 * y el de la Divina Misericordia sí se avisan: no llevan ese nombre.
 */
const esOctavaDePascua = (name: string) => /Octava de Pascua/i.test(name);

/**
 * SOLEMNIDADES en una fecha, para el aviso de cercanía al Pueblo fiel.
 *
 * Los domingos corrientes quedan fuera a propósito: avisar cada semana de "2.º Domingo
 * del Tiempo Ordinario" sería ruido y entrena a la gente a ignorar las notificaciones.
 * Se avisa de las 18 grandes del año — Navidad, Pascua, Pentecostés, Corpus, Asunción,
 * Todos los Santos, Cristo Rey, la Inmaculada… — más lo que la parroquia agregue a mano.
 */
export function solemnitiesOn(date: string): string[] {
  return BASE_CELEBRATIONS
    .filter((e) => e.date === date && e.solemne && !esOctavaDePascua(e.name))
    .map((e) => e.name);
}

async function customCelebrationsOn(date: string): Promise<{ name: string; scope: string }[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/custom_liturgical_dates?date=eq.${date}&select=name,scope`, { headers: svcHeaders });
  return r.ok ? await r.json() : [];
}

/** ¿La parroquia ya tiene un cantoral publicado para alguna de esas fechas (incluye víspera)? */
async function parishHasCantoral(parish: string, dates: string[]): Promise<boolean> {
  const orExpr = `(${dates.map((d) => `date.eq.${d}`).join(',')})`;
  // ilike sobre el nombre recortado, igual que listCantorals: con `eq` exacto, un
  // espacio de más en la parroquia del perfil hacía creer que NO había cantoral y el
  // coro recibía el recordatorio de "publica" aunque ya lo hubiera publicado.
  const escapado = parish.trim().replace(/[\\%_]/g, (m) => `\\${m}`);
  const url = `${SUPABASE_URL}/rest/v1/published_cantorals?parish_name=ilike.${encodeURIComponent(escapado)}&or=${encodeURIComponent(orExpr)}&select=id&limit=1`;
  const r = await fetch(url, { headers: svcHeaders });
  if (!r.ok) return false;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}

let _webpush: any = null;
async function webpushLib(): Promise<any> {
  if (_webpush) return _webpush;
  const mod: any = await import('web-push');
  _webpush = mod?.default ?? mod;
  return _webpush;
}
async function querySubs(filter: string): Promise<{ endpoint: string; p256dh: string; auth: string }[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth&${filter}`, { headers: svcHeaders });
  return r.ok ? await r.json() : [];
}
/**
 * urgency 'high' + TTL de 12 h. Con la urgencia por defecto, Android puede retener el
 * aviso hasta que el teléfono despierte, y un recordatorio que llega tarde no sirve.
 * Sin TTL el valor por defecto son cuatro semanas: llegaban recordatorios de fechas ya
 * pasadas cuando alguien encendía un teléfono guardado.
 */
const PUSH_OPTS = { urgency: 'high' as const, TTL: 12 * 60 * 60 };

/**
 * Manda a cada suscriptor, con UN reintento ante fallo transitorio (429 / 5xx del push
 * service). Sin reintento ese aviso se perdía en silencio, y es una de las razones de
 * que "no lleguen todas". El 404/410 es otra cosa: la suscripción ya no existe.
 */
async function sendToSubs(subs: { endpoint: string; p256dh: string; auth: string }[], payload: object): Promise<number> {
  if (!VAPID_PRIVATE || subs.length === 0) return 0;
  const webpush = await webpushLib();
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const body = JSON.stringify(payload);
  let sent = 0;

  const uno = async (s: { endpoint: string; p256dh: string; auth: string }, reintento = false): Promise<void> => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, PUSH_OPTS);
      sent++;
    } catch (e: any) {
      const code = Number(e?.statusCode) || 0;
      if (code === 404 || code === 410) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE', headers: svcHeaders }).catch(() => {});
        return;
      }
      if (!reintento && (code === 429 || code >= 500)) {
        await new Promise((r) => setTimeout(r, 800));
        return uno(s, true);
      }
    }
  };

  await Promise.all(subs.map((s) => uno(s)));
  return sent;
}

/**
 * Comparación de parroquias tolerante (misma idea que listCantorals y notify-cantoral).
 * La suscripción guarda la parroquia tal cual la trae el perfil y la celebración la
 * guarda recortada: un espacio o una mayúscula de diferencia dejaban al suscriptor sin
 * recordatorio, sin ningún error a la vista.
 */
const normParish = (x: unknown): string =>
  String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Rol con el que se decide si a alguien le toca el recordatorio del jueves.
 *
 * Manda el perfil; la suscripción es solo el respaldo para quien activó los avisos sin
 * tener cuenta. Ver el bloque del digest al coro para el porqué.
 */
export function rolParaRecordatorio(
  sub: { role: string | null; user_id: string | null },
  rolDelPerfil: Map<string, string | null>,
): string | null {
  return (sub.user_id ? rolDelPerfil.get(sub.user_id) : null) ?? sub.role;
}

/** ¿A esta persona le toca el recordatorio de "publica el cantoral"? */
export function leTocaRecordatorioDeCoro(rol: string | null): boolean {
  return rol === 'Coro' || rol === 'Admin';
}

/** Une una lista para el cuerpo del push, con tope (máx 3 + "y N más"). */
export function digestBody(items: string[], max = 3): string {
  if (items.length <= max) return items.join(' · ');
  return `${items.slice(0, max).join(' · ')} y ${items.length - max} más`;
}

/** Endpoint sin la parte secreta: sirve para distinguir dispositivos en el diagnóstico. */
const maskEndpoint = (ep: string) => {
  const host = ep.replace(/^https?:\/\//, '').split('/')[0];
  return `${host}/…${ep.slice(-8)}`;
};

/**
 * Deja constancia de la corrida en `cron_runs` (migración 20260731_cron_runs).
 * En Hobby no hay retención de logs ni historial de crons, así que sin esto no se
 * puede saber si el cron corrió un día dado. NUNCA debe tumbar la corrida: si el
 * registro falla, se ignora — el trabajo real ya se hizo.
 */
/**
 * ¿Ya hubo hoy una corrida EXITOSA? Permite tener DOS disparadores —el cron de Vercel
 * y el workflow de GitHub Actions— sin que los avisos salgan por duplicado: el primero
 * que llegue hace el trabajo y el segundo se retira. Hacen falta los dos porque ninguno
 * es fiable por separado (Hobby se saltó 2 de 7 días; los schedules de Actions también
 * se retrasan o se pierden bajo carga).
 *
 * Solo cuentan las exitosas: si la primera reventó a mitad, la segunda debe reintentar.
 * Si la consulta falla asumimos que NO corrió: es preferible un aviso repetido —y los
 * tags son estables, así que el nuevo reemplaza al anterior— a quedarse sin avisar.
 */
async function alreadyRanToday(date: string): Promise<boolean> {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/cron_runs?job=eq.celebration-reminders&logical_date=eq.${date}&ok=is.true&select=id&limit=1`,
      { headers: svcHeaders },
    );
    if (!r.ok) return false;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

/** Cuántas suscripciones vivas había al correr (contexto para leer los envíos). */
async function countSubs(): Promise<number | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=id&limit=1`, {
      headers: { ...svcHeaders, Prefer: 'count=exact' },
    });
    const n = Number((r.headers.get('content-range') || '').split('/')[1]); // "0-0/4"
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function logRun(row: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cron_runs`, {
      method: 'POST',
      headers: { ...svcHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ job: 'celebration-reminders', ...row }),
    });
  } catch {
    /* la bitácora es best-effort */
  }
}

/**
 * Compara el header Authorization con el secreto en tiempo constante. Dynamic import
 * de `node:crypto` por la misma razón que web-push: en este setup de Vercel los imports
 * top-level fuera de tipos han roto la función al cargar más de una vez.
 */
async function bearerMatches(header: string, secret: string): Promise<boolean> {
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false; // timingSafeEqual exige igual largo
  const { timingSafeEqual } = await import('node:crypto');
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Con CRON_SECRET configurado el Bearer es OBLIGATORIO. La cabecera `x-vercel-cron` la
  // puede mandar cualquiera —no la valida nadie— así que solo sirve de fallback mientras
  // no haya secreto. Vercel inyecta `Authorization: Bearer $CRON_SECRET` por su cuenta en
  // las llamadas del cron en cuanto la env var existe, así que la corrida programada sigue
  // funcionando sin tocar vercel.json.
  const CRON_SECRET = (process.env.CRON_SECRET || '').trim();
  const authHeader = (req.headers.authorization as string) || '';
  const authOk = !!CRON_SECRET && (await bearerMatches(authHeader, CRON_SECRET));
  const headerOk = !CRON_SECRET && !!req.headers['x-vercel-cron'];
  if (!authOk && !headerOk) return res.status(401).json({ error: 'No autorizado' });

  if (!SUPABASE_URL || !SERVICE) return res.status(500).json({ error: 'Config incompleta' });
  if (!VAPID_PRIVATE) return res.status(200).json({ ok: true, skipped: 'push no configurado (VAPID)' });

  // ── MODO DIAGNÓSTICO (?dry=1) ──────────────────────────────────────────────
  // Recorre exactamente la misma lógica pero NO envía nada: responde a quién le
  // habría llegado y por qué. `?date=YYYY-MM-DD` simula otro día (p. ej. para
  // reconstruir la corrida de un jueves pasado) y SOLO se acepta junto con dry=1,
  // para que nadie pueda disparar avisos de una fecha arbitraria.
  const dry = /^(1|true|yes|on)$/i.test(String(req.query?.dry ?? ''));
  const simDate = String(req.query?.date ?? '');
  const useSim = dry && /^\d{4}-\d{2}-\d{2}$/.test(simDate);

  const today = useSim ? simDate : todayInSantiago();
  const topicCeleb = `topics=cs.${encodeURIComponent('{celebrations}')}`;
  let generalSent = 0;
  let coroSent = 0;
  let courseSent = 0;
  const startedAt = Date.now();

  // Doble disparador (Vercel + GitHub Actions): el segundo en llegar no reenvía.
  // No aplica al dry-run, que no envía nada y debe poder consultarse siempre.
  if (!dry && (await alreadyRanToday(today))) {
    return res.status(200).json({ ok: true, date: today, skipped: 'ya se envió hoy' });
  }

  // En dry-run contamos destinatarios y guardamos el aviso que se habría mandado.
  const preview: { to: number; title: string; body: string }[] = [];
  const deliver = async (subs: { endpoint: string; p256dh: string; auth: string }[], payload: any): Promise<number> => {
    if (!dry) return sendToSubs(subs, payload);
    if (subs.length > 0) preview.push({ to: subs.length, title: payload.title, body: payload.body });
    return subs.length;
  };

  // Una consulta por PARROQUIA, no por suscriptor: en un coro de diez personas todos
  // comparten parroquia y antes se preguntaba diez veces lo mismo. Con la función de
  // Vercel limitada en tiempo, esa multiplicación es lo que puede dejar la corrida a
  // medias y hacer que el recordatorio del jueves no salga.
  const cacheCantoral = new Map<string, Promise<boolean>>();
  const yaTieneCantoral = (parish: string, fecha: string): Promise<boolean> => {
    const clave = `${normParish(parish)}|${fecha}`;
    let p = cacheCantoral.get(clave);
    if (!p) { p = parishHasCantoral(parish, [fecha]); cacheCantoral.set(clave, p); }
    return p;
  };

  try {
    // ── 1) DIGEST de celebraciones próximas (7 y 1 día) → topic 'celebrations' ──
    // Reunimos TODAS las celebraciones personalizadas de las ventanas y mandamos UN
    // solo aviso por suscriptor con la lista (evita saturar en semanas con varias).
    const celebItems: { name: string; scope: string; lead: number }[] = [];
    for (const lead of [7, 1]) {
      const target = addDays(today, lead);
      // Las agregadas a mano (con su alcance: global o una parroquia)…
      for (const c of await customCelebrationsOn(target)) {
        celebItems.push({ name: c.name, scope: c.scope, lead });
      }
      // …y las SOLEMNIDADES del calendario, que valen para todos. Los domingos
      // corrientes NO entran: ver solemnitiesOn.
      for (const nombre of solemnitiesOn(target)) {
        celebItems.push({ name: nombre, scope: 'global', lead });
      }
    }
    if (celebItems.length > 0) {
      const cs = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?${topicCeleb}&select=endpoint,p256dh,auth,parishes`, { headers: svcHeaders });
      const celebSubs: { endpoint: string; p256dh: string; auth: string; parishes: string[] }[] = cs.ok ? await cs.json() : [];
      for (const sub of celebSubs) {
        const seen = new Set<string>();
        const mine = celebItems
          .filter((it) => it.scope === 'global'
            || (sub.parishes || []).some((pp) => normParish(pp) === normParish(it.scope)))
          .filter((it) => (seen.has(it.name) ? false : (seen.add(it.name), true)));
        if (mine.length === 0) continue;
        generalSent += await deliver([{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }], {
          title: mine.length === 1 ? 'Celebración próxima ✝️' : 'Celebraciones próximas ✝️',
          body: digestBody(mine.map((it) => `${it.name} (${leadLabel(it.lead)})`)),
          url: '/',
          tag: 'celeb-reminder', // estable → un solo aviso, no se apilan entre corridas
        });
      }
    }

    // ── 2) DIGEST al CORO (3 días): publica los cantorales PENDIENTES de esa fecha ──
    // Un único aviso por coro que lista las parroquias/celebraciones sin cantoral.
    const target3 = addDays(today, 3);
    const base3 = baseCelebrationsOn(target3);           // domingos + solemnidades (globales)
    const custom3 = await customCelebrationsOn(target3);

    // ── A quién va este recordatorio ────────────────────────────────────────
    //
    // SOLO a los coros (y a los administradores, que también publican). Al Pueblo fiel
    // no le sirve de nada que le digan que publique un cantoral: a ellos les llega el
    // aviso cuando el coro lo PUBLICA, que va por parroquia y sin filtro de rol.
    //
    // El rol se toma del PERFIL, no del que quedó congelado en la suscripción. La
    // suscripción guarda el rol que tenía la persona el día que activó los avisos, y
    // ese dato envejece: quien activó las notificaciones siendo Pueblo fiel y después
    // pasó a Coro no volvía a recibir este aviso hasta que la app resincronizara su
    // suscripción — es decir, podía pasarse semanas sin el recordatorio del jueves sin
    // que nada lo delatara. Preguntando por el perfil, el reparto es siempre el de hoy.
    //
    // Para una suscripción sin cuenta asociada (se activó sin sesión) no hay perfil que
    // consultar: ahí se respeta lo que guardó la propia suscripción.
    const [cr, pr] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,p256dh,auth,parishes,role,user_id`, { headers: svcHeaders }),
      fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,role`, { headers: svcHeaders }),
    ]);
    const todasLasSubs: { endpoint: string; p256dh: string; auth: string; parishes: string[]; role: string | null; user_id: string | null }[] =
      cr.ok ? await cr.json() : [];
    const perfiles: { id: string; role: string | null }[] = pr.ok ? await pr.json() : [];
    const rolDelPerfil = new Map(perfiles.map((x) => [x.id, x.role]));
    const coroSubs = todasLasSubs.filter((s) => leTocaRecordatorioDeCoro(rolParaRecordatorio(s, rolDelPerfil)));

    // Diagnóstico: por qué cada suscriptor Coro/Admin recibe o no el aviso.
    const coroDetail: { device: string; rol: string; parishes: string[]; pending: string[]; skipped: string }[] = [];

    for (const sub of coroSubs) {
      const parishes = Array.from(new Set(sub.parishes || []));
      const pending: string[] = [];
      const skipped: string[] = [];
      for (const parish of parishes) {
        const rel = [
          ...base3,
          ...custom3
            .filter((c) => c.scope === 'global' || normParish(c.scope) === normParish(parish))
            .map((c) => c.name),
        ];
        if (rel.length === 0) { skipped.push(`${parish}: sin celebración ese día`); continue; }
        // Basta con mirar la fecha de la CELEBRACIÓN. Una Misa vespertina se guarda
        // con la fecha del domingo (el tipo 'visperas_i' es lo que la corre a la tarde
        // del sábado), así que target3 ya la cubre. Antes se miraba también el sábado:
        // publicar una Misa del sábado hacía creer que el domingo ya estaba listo y el
        // coro se quedaba SIN el recordatorio del jueves.
        if (await yaTieneCantoral(parish, target3)) { skipped.push(`${parish}: ya publicado`); continue; }
        pending.push(parishes.length > 1 ? `${parish}: ${rel[0]}` : rel[0]);
      }
      if (dry) {
        coroDetail.push({
          device: maskEndpoint(sub.endpoint),
          // El rol EFECTIVO (el del perfil), que es el que decidió incluirlo. Sin esto,
          // al preguntarse "¿por qué a este no le llega?" no había forma de saber si el
          // motivo era el rol o la parroquia.
          rol: `${rolParaRecordatorio(sub, rolDelPerfil) ?? '(sin rol)'}${sub.role !== rolParaRecordatorio(sub, rolDelPerfil) ? ` (la suscripcion decia ${sub.role ?? 'nada'})` : ''}`,
          parishes,
          pending,
          skipped: parishes.length === 0 ? 'suscripción sin parroquias' : skipped.join(' | '),
        });
      }
      if (pending.length === 0) continue;
      coroSent += await deliver([{ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }], {
        title: 'Publica el cantoral 🎼',
        body: `${digestBody(pending)} — en 3 días`,
        url: '/', // el Coro llega a su pantalla principal (constructor del cantoral)
        tag: 'coropub', // estable → un solo aviso de "publica" por coro, no se apilan
      });
    }

    // ── 3) CÁPSULA DE LA SEMANA (lunes) → formación (Cursos) ──
    // Solo se envía cuando ya HAY videos: se activa con la env var COURSE_WEEKLY_ENABLED.
    // Un único aviso semanal a todos los suscriptores; abre directo el módulo Cursos.
    const courseOn = /^(1|true|yes|on)$/i.test((process.env.COURSE_WEEKLY_ENABLED || '').trim());
    const isMonday = new Date(`${today}T12:00:00Z`).getUTCDay() === 1;
    if (courseOn && isMonday) {
      const allSubs = await querySubs(''); // querySubs arma ?select=...&<filtro>; vacío = todos
      courseSent = await deliver(allSubs, {
        title: '🎓 Lunes de formación',
        body: 'Tu cápsula de la semana te espera: 5 minutos para crecer como músico católico.',
        url: '/?goto=cursos',
        tag: `formacion-${today}`, // estable por semana (solo corre el lunes)
      });
    }

    if (!dry) {
      // La bitácora es lo único que permite responder después "¿corrió el jueves?".
      await logRun({
        logical_date: today,
        general_sent: generalSent,
        coro_sent: coroSent,
        course_sent: courseSent,
        subs_total: await countSubs(),
        duration_ms: Date.now() - startedAt,
        ok: true,
      });
      return res.status(200).json({ ok: true, date: today, generalSent, coroSent, courseSent });
    }

    // Radiografía completa de las suscripciones: si aquí no aparece el dispositivo,
    // el problema es la suscripción (se perdió/expiró), no el cron.
    const all = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=endpoint,role,parishes,topics,updated_at`,
      { headers: svcHeaders },
    );
    const rows: { endpoint: string; role: string | null; parishes: string[]; topics: string[]; updated_at: string }[] =
      all.ok ? await all.json() : [];
    const byRole: Record<string, number> = {};
    for (const r of rows) byRole[r.role ?? '(sin rol)'] = (byRole[r.role ?? '(sin rol)'] ?? 0) + 1;

    // Bitácora: si aquí falta el jueves, el cron no se disparó ese día.
    const runsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/cron_runs?select=ran_at,logical_date,general_sent,coro_sent,course_sent,subs_total,duration_ms,ok,error&order=ran_at.desc&limit=20`,
      { headers: svcHeaders },
    );
    const ultimasCorridas = runsRes.ok
      ? await runsRes.json()
      : { error: `no se pudo leer cron_runs (HTTP ${runsRes.status}) — ¿falta aplicar la migración 20260731_cron_runs?` };

    return res.status(200).json({
      ok: true,
      dryRun: true,
      date: today,
      simulated: useSim,
      ultimasCorridas,
      wouldSend: { generalSent, coroSent, courseSent },
      preview,
      celebraciones: { target3, base: base3, custom: custom3 },
      suscripciones: {
        total: rows.length,
        porRol: byRole,
        sinParroquias: rows.filter((r) => !(r.parishes || []).length).length,
        detalle: rows.map((r) => ({
          device: maskEndpoint(r.endpoint),
          role: r.role,
          parishes: r.parishes,
          topics: r.topics,
          updated_at: r.updated_at,
        })),
      },
      coroDetail,
    });
  } catch (e: any) {
    // Una corrida que revienta a mitad también deja rastro: sin esto, un fallo se ve
    // igual que un cron que nunca se disparó.
    if (!dry) {
      await logRun({
        logical_date: today,
        general_sent: generalSent,
        coro_sent: coroSent,
        course_sent: courseSent,
        duration_ms: Date.now() - startedAt,
        ok: false,
        error: String(e?.message || e).slice(0, 500),
      });
    }
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}
