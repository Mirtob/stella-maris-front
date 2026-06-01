import { PublishedCantoral } from '../types';
import { mockSongs } from './songs';

// Mock published cantorals for demonstration
export const mockPublishedCantorals: PublishedCantoral[] = [
  {
    id: 'pc1',
    choirId: 'choir1',
    choirName: 'Coro Parroquial',
    parishName: 'Parroquia San Pedro Apóstol',
    date: '2026-01-25',
    liturgicalDate: '3er Domingo del Tiempo Ordinario',
    massTime: '08:00 AM',
    createdAt: '2026-01-20T10:00:00Z',
    publishedBy: 'Coro Principal',
    publishedAt: '2026-01-20T10:00:00Z',
    status: 'published',
    songs: [
      mockSongs[0],  // Entrada
      mockSongs[4],  // Kyrie - Misa Gregoriana
      mockSongs[5],  // Gloria - Misa Gregoriana
      mockSongs[19], // Salmo
      mockSongs[22], // Aleluya
      mockSongs[25], // Post Evangelio
      mockSongs[28], // Ofertorio
      mockSongs[6],  // Santo - Misa Gregoriana
      mockSongs[7],  // Cordero - Misa Gregoriana
      mockSongs[31], // Comunión
      mockSongs[32], // Comunión 2
      mockSongs[37], // Salida
    ],
  },
  {
    id: 'pc1b',
    choirId: 'choir2',
    choirName: 'Grupo de Alabanza',
    parishName: 'Parroquia San Pedro Apóstol',
    date: '2026-01-25',
    liturgicalDate: '3er Domingo del Tiempo Ordinario',
    massTime: '10:00 AM',
    createdAt: '2026-01-20T11:00:00Z',
    publishedBy: 'Coro Juvenil',
    publishedAt: '2026-01-20T11:00:00Z',
    status: 'published',
    songs: [
      mockSongs[1],  // Entrada
      mockSongs[8],  // Kyrie - Misa Criolla
      mockSongs[9],  // Gloria - Misa Criolla
      mockSongs[20], // Salmo
      mockSongs[23], // Aleluya
      mockSongs[26], // Post Evangelio
      mockSongs[29], // Ofertorio
      mockSongs[10], // Santo - Misa Criolla
      mockSongs[11], // Cordero - Misa Criolla
      mockSongs[33], // Comunión
      mockSongs[35], // Comunión 2
      mockSongs[38], // Salida
    ],
  },
  {
    id: 'pc1c',
    choirId: 'choir3',
    choirName: 'Coro de Guitarra',
    parishName: 'Parroquia San Pedro Apóstol',
    date: '2026-01-25',
    liturgicalDate: '3er Domingo del Tiempo Ordinario',
    massTime: '12:00 PM',
    createdAt: '2026-01-20T12:00:00Z',
    publishedBy: 'Guitarristas',
    publishedAt: '2026-01-20T12:00:00Z',
    status: 'published',
    songs: [
      mockSongs[2],  // Entrada
      mockSongs[12], // Kyrie - Misa Popular
      mockSongs[13], // Gloria - Misa Popular
      mockSongs[21], // Salmo
      mockSongs[24], // Aleluya
      mockSongs[27], // Post Evangelio
      mockSongs[30], // Ofertorio
      mockSongs[14], // Santo - Misa Popular
      mockSongs[15], // Cordero - Misa Popular
      mockSongs[34], // Comunión
      mockSongs[36], // Comunión 2
      mockSongs[39], // Salida
    ],
  },
  {
    id: 'pc1d',
    choirId: 'choir1',
    choirName: 'Coro Parroquial',
    parishName: 'Parroquia San Pedro Apóstol',
    date: '2026-01-25',
    liturgicalDate: '3er Domingo del Tiempo Ordinario',
    massTime: '07:00 PM',
    createdAt: '2026-01-20T13:00:00Z',
    publishedBy: 'Coro Vespertino',
    publishedAt: '2026-01-20T13:00:00Z',
    status: 'published',
    songs: [
      mockSongs[0],  // Entrada
      mockSongs[16], // Kyrie - Otra misa
      mockSongs[17], // Gloria - Otra misa
      mockSongs[19], // Salmo
      mockSongs[22], // Aleluya
      mockSongs[25], // Post Evangelio
      mockSongs[28], // Ofertorio
      mockSongs[18], // Santo
      mockSongs[7],  // Cordero
      mockSongs[31], // Comunión
      mockSongs[37], // Salida
    ],
  },
  {
    id: 'pc2',
    choirId: 'choir2',
    choirName: 'Grupo de Alabanza',
    parishName: 'Parroquia Nuestra Señora de Guadalupe',
    date: '2026-02-01',
    liturgicalDate: '4° Domingo del Tiempo Ordinario',
    massTime: '09:00 AM',
    createdAt: '2026-01-27T15:30:00Z',
    publishedBy: 'Coro Juvenil',
    publishedAt: '2026-01-27T15:30:00Z',
    status: 'published',
    songs: [
      mockSongs[1],  // Entrada
      mockSongs[8],  // Kyrie - Misa Criolla
      mockSongs[9],  // Gloria - Misa Criolla
      mockSongs[20], // Salmo
      mockSongs[24], // Aleluya
      mockSongs[26], // Post Evangelio
      mockSongs[29], // Ofertorio
      mockSongs[10], // Santo - Misa Criolla
      mockSongs[11], // Cordero - Misa Criolla
      mockSongs[33], // Comunión
      mockSongs[35], // Comunión 2
      mockSongs[38], // Salida
    ],
  },
  {
    id: 'pc3',
    choirId: 'choir1',
    choirName: 'Coro Parroquial',
    parishName: 'Parroquia San Pedro Apóstol',
    date: '2026-02-01',
    liturgicalDate: '4° Domingo del Tiempo Ordinario',
    massTime: '11:30 AM',
    createdAt: '2026-01-28T10:00:00Z',
    publishedBy: 'Coro Principal',
    publishedAt: '2026-01-28T10:00:00Z',
    status: 'published',
    songs: [
      mockSongs[2],  // Entrada
      mockSongs[4],  // Kyrie
      mockSongs[5],  // Gloria
      mockSongs[19], // Salmo
      mockSongs[22], // Aleluya
      mockSongs[25], // Post Evangelio
      mockSongs[28], // Ofertorio
      mockSongs[6],  // Santo
      mockSongs[7],  // Cordero
      mockSongs[32], // Comunión
      mockSongs[37], // Salida
    ],
  },
  // Cantorales en BORRADOR (solo visible para Coros)
  {
    id: 'draft1',
    choirId: 'choir1',
    choirName: 'Coro Parroquial',
    parishName: 'Parroquia San Pedro Apóstol',
    date: '2026-02-08',
    liturgicalDate: '5° Domingo del Tiempo Ordinario',
    massTime: '10:00 AM',
    createdAt: '2026-02-01T10:00:00Z',
    publishedBy: undefined,
    publishedAt: undefined,
    status: 'draft',
    songs: [
      mockSongs[0],  // Entrada
      mockSongs[4],  // Kyrie
      mockSongs[5],  // Gloria
      mockSongs[19], // Salmo
    ],
  },
];