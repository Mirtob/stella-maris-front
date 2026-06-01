# 📖 Casos de Uso y Flujos - Stella Maris

## 📋 Tabla de Contenidos

1. [Casos de Uso por Rol](#casos-de-uso-por-rol)
2. [Flujos de Usuario](#flujos-de-usuario)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Escenarios de Edge Cases](#escenarios-de-edge-cases)

---

## 👤 Casos de Uso por Rol

### 🎤 Coro

#### CU-01: Registro y Primera Configuración

**Actor:** Coro (nuevo usuario)

**Precondiciones:** 
- Usuario tiene cuenta de Google
- No ha usado la aplicación antes

**Flujo Principal:**
1. Usuario accede a la aplicación
2. Sistema muestra pantalla de Login
3. Usuario hace click en "Continuar con Google"
4. Sistema redirige a Google OAuth
5. Usuario autoriza la aplicación
6. Google redirige de vuelta con token
7. Sistema detecta que es un usuario nuevo
8. Sistema muestra ProfileSetup
9. Usuario selecciona rol "Coro"
10. Sistema muestra selector de instrumento
11. Usuario selecciona instrumento (Coro/Guitarra/Órgano)
12. Usuario ingresa nombre de parroquia
13. Usuario hace click en "Continuar"
14. Sistema crea perfil en base de datos
15. Sistema muestra ChoirView con instrumento configurado

**Postcondiciones:**
- Perfil de usuario creado en `user_profiles`
- Usuario autenticado y en ChoirView
- Instrumento preferido guardado

**Variantes:**
- 12a. Usuario no ingresa parroquia → Sistema permite continuar sin parroquia

---

#### CU-02: Crear Cantoral para Misa Dominical

**Actor:** Coro

**Precondiciones:**
- Usuario autenticado como Coro
- Existen cantos en la base de datos

**Flujo Principal:**
1. Coro accede a ChoirView
2. Sistema muestra categorías litúrgicas vacías
3. Coro hace click en "Entrada 🚪"
4. Sistema muestra buscador de cantos de Entrada
5. Sistema filtra cantos mostrando primero los del instrumento preferido
6. Coro busca "Juntos como hermanos"
7. Sistema muestra resultados
8. Coro hace click en "Agregar"
9. Sistema agrega canto al cantoral
10. Sistema muestra check verde en el canto
11. Sistema actualiza vista previa del cantoral
12. Coro repite pasos 3-11 para Kyrie
13. Sistema agrega Kyrie automáticamente
14. Sistema agrega Santo automáticamente
15. Sistema agrega Cordero de Dios automáticamente
16. Sistema muestra diálogo "¿Agregar Gloria?"
17. Coro hace click en "Sí, agregar Gloria"
18. Sistema agrega Gloria al cantoral
19. Coro continúa agregando: Salmo, Aleluya, Post Evangelio, Ofertorio, Comunión (2 cantos), Salida
20. Coro hace click en "Publicar Cantoral"
21. Sistema muestra modal de publicación
22. Coro ingresa:
    - Fecha: 26/01/2025
    - Fecha litúrgica: "3er Domingo del Tiempo Ordinario"
    - Hora de misa: "10:00 AM"
23. Coro hace click en "Publicar"
24. Sistema valida datos
25. Sistema crea registro en `published_cantorals`
26. Sistema crea relaciones en `cantoral_songs`
27. Sistema muestra toast de éxito
28. Sistema limpia el cantoral actual

**Postcondiciones:**
- Cantoral publicado en base de datos
- Pueblo fiel puede ver el cantoral
- Cantoral aparece en historial del coro

**Variantes:**
- 17a. Coro hace click en "No, gracias" → Gloria NO se agrega
- 22a. Fecha es pasada → Sistema muestra warning pero permite continuar
- 24a. Datos inválidos → Sistema muestra error y no publica

---

#### CU-03: Reemplazar Canto en Cantoral

**Actor:** Coro

**Precondiciones:**
- Coro tiene cantoral en proceso
- Cantoral ya tiene un canto de Entrada

**Flujo Principal:**
1. Coro decide cambiar el canto de Entrada
2. Coro hace click en "Entrada 🚪"
3. Sistema muestra buscador con el canto actual marcado
4. Coro busca otro canto
5. Coro hace click en "Agregar" en el nuevo canto
6. Sistema remueve automáticamente el canto anterior de Entrada
7. Sistema agrega el nuevo canto
8. Sistema muestra toast: "Canto de Entrada actualizado"
9. Sistema actualiza vista previa del cantoral

**Postcondiciones:**
- Solo hay un canto de Entrada en el cantoral
- Vista previa muestra el nuevo canto

**Regla de negocio:** Solo Comunión permite múltiples cantos

---

#### CU-04: Agregar Múltiples Cantos de Comunión

**Actor:** Coro

**Precondiciones:**
- Coro tiene cantoral en proceso

**Flujo Principal:**
1. Coro hace click en "Comunión 🍷"
2. Sistema muestra buscador de cantos de Comunión
3. Coro hace click en "Agregar" en "Pescador de Hombres"
4. Sistema agrega canto al cantoral
5. Coro hace click en "Agregar" en "Pan de Vida"
6. Sistema agrega segundo canto SIN remover el primero
7. Sistema actualiza vista previa mostrando ambos cantos
8. Coro hace click en "Agregar" en "Vine a Alabarte"
9. Sistema agrega tercer canto
10. Vista previa muestra 3 cantos de Comunión en orden

**Postcondiciones:**
- Cantoral tiene múltiples cantos de Comunión
- Todos los cantos se conservan

**Regla de negocio:** Comunión es la única categoría que permite múltiples cantos

---

### 👨‍👩‍👧‍👦 Pueblo Fiel

#### CU-05: Ver Cantorales Publicados

**Actor:** Pueblo Fiel

**Precondiciones:**
- Usuario autenticado como Pueblo Fiel
- Existen cantorales publicados

**Flujo Principal:**
1. Usuario accede a PublishedCantorals
2. Sistema carga cantorales de todas las parroquias
3. Sistema muestra lista ordenada por fecha (más reciente primero)
4. Usuario ve cantorales con:
   - Nombre de parroquia
   - Fecha de la misa
   - Fecha litúrgica
   - Hora de misa
   - Nombre del coro
5. Usuario hace click en un cantoral
6. Sistema muestra detalle completo del cantoral
7. Sistema muestra ordinario de la misa con indicaciones posturales:
   - "🚶 DE PIE - Entrada"
   - "🧎 DE RODILLAS - Kyrie"
   - "🚶 DE PIE - Gloria"
   - etc.
8. Usuario puede ver todos los cantos con sus detalles

**Postcondiciones:**
- Usuario puede consultar cantoral en cualquier momento
- Usuario sabe cuándo ponerse de pie/sentarse/arrodillarse

---

#### CU-06: Reproducir Canto y Ver Partitura

**Actor:** Pueblo Fiel

**Precondiciones:**
- Usuario está viendo un cantoral
- Canto tiene YouTube ID y partitura

**Flujo Principal:**
1. Usuario hace click en "Ver Detalles" de un canto
2. Sistema abre SongPlayer
3. Sistema muestra:
   - Título del canto
   - Autor
   - Categoría litúrgica
   - Reproductor de YouTube embebido
4. Usuario hace click en Play en el video
5. Video comienza a reproducirse
6. Usuario hace click en "Ver Partitura"
7. Sistema muestra PDF de la partitura
8. Usuario puede hacer zoom in/out
9. Usuario puede descargar PDF
10. Usuario puede imprimir PDF

**Postcondiciones:**
- Usuario aprendió el canto
- Usuario tiene partitura para practicar

**Variantes:**
- 6a. Canto no tiene partitura → Botón "Ver Partitura" está deshabilitado

---

#### CU-07: Filtrar Cantorales por Parroquia

**Actor:** Pueblo Fiel

**Precondiciones:**
- Existen cantorales de múltiples parroquias

**Flujo Principal:**
1. Usuario está en PublishedCantorals
2. Usuario hace click en filtro de parroquia
3. Sistema muestra lista de parroquias disponibles
4. Usuario selecciona "Parroquia San Juan"
5. Sistema filtra cantorales mostrando solo los de esa parroquia
6. Usuario ve solo cantorales relevantes
7. Usuario hace click en "Limpiar filtros"
8. Sistema muestra todos los cantorales nuevamente

**Postcondiciones:**
- Usuario ve solo cantorales de su parroquia

---

### 🔧 Admin

#### CU-08: Agregar Nuevo Canto a la Biblioteca

**Actor:** Admin

**Precondiciones:**
- Usuario autenticado como Admin
- Tiene YouTube ID del canto
- (Opcional) Tiene partitura en PDF

**Flujo Principal:**
1. Admin accede a AdminDashboard
2. Admin hace click en "Agregar Canto"
3. Sistema muestra formulario
4. Admin completa:
   - Título: "Ave María"
   - Autor: "Franz Schubert"
   - Categoría: "Comunión"
   - YouTube URL: "https://www.youtube.com/watch?v=abc12345678"
   - Duración: "4:30"
   - Versión: "Órgano"
5. Sistema extrae YouTube ID automáticamente
6. Sistema valida que el ID es válido (11 caracteres)
7. Admin hace click en "Subir Partitura"
8. Admin selecciona archivo PDF
9. Sistema valida que es PDF y < 10MB
10. Admin hace click en "Guardar Canto"
11. Sistema sube PDF a Storage
12. Sistema obtiene URL pública del PDF
13. Sistema crea registro en tabla `songs`
14. Sistema muestra toast de éxito
15. Canto aparece en la biblioteca

**Postcondiciones:**
- Canto disponible para todos los coros
- Partitura accesible públicamente

**Variantes:**
- 9a. Archivo no es PDF → Sistema muestra error
- 9b. Archivo > 10MB → Sistema muestra error
- 6a. YouTube ID inválido → Sistema muestra error

---

#### CU-09: Crear Misa Completa (Ordinario)

**Actor:** Admin

**Precondiciones:**
- Admin tiene acceso a AdminDashboard
- Tiene URLs de YouTube para Kyrie, Gloria, Santo, Cordero

**Flujo Principal:**
1. Admin decide agregar "Misa de la Alegría"
2. Admin agrega Kyrie:
   - Título: "Kyrie Eleison"
   - Categoría: "Kyrie"
   - Nombre de Misa: "Misa de la Alegría"
   - Versión: "Guitarra"
   - YouTube ID: "abc123..."
3. Admin agrega Gloria:
   - Título: "Gloria a Dios"
   - Categoría: "Gloria"
   - Nombre de Misa: "Misa de la Alegría"
   - Versión: "Guitarra"
   - YouTube ID: "def456..."
4. Admin agrega Santo:
   - Título: "Santo es el Señor"
   - Categoría: "Santo"
   - Nombre de Misa: "Misa de la Alegría"
   - Versión: "Guitarra"
   - YouTube ID: "ghi789..."
5. Admin agrega Cordero de Dios:
   - Título: "Cordero de Dios"
   - Categoría: "Cordero de Dios"
   - Nombre de Misa: "Misa de la Alegría"
   - Versión: "Guitarra"
   - YouTube ID: "jkl012..."
6. Sistema agrupa automáticamente estos cantos por `mass_name`
7. Cuando un coro agregue el Kyrie, se agregarán automáticamente Santo y Cordero

**Postcondiciones:**
- Misa completa disponible
- Coros pueden agregar ordinario completo de una vez

**Regla de negocio:** `mass_name` debe ser idéntico en todos los cantos del ordinario

---

## 🔄 Flujos de Usuario

### Flujo Completo: Domingo en la Parroquia

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMANA ANTES DE LA MISA                      │
└─────────────────────────────────────────────────────────────────┘

LUNES - Coro planifica
├─ Coro inicia sesión
├─ Revisa calendario litúrgico (3er Domingo del Tiempo Ordinario)
├─ Busca cantos apropiados por categoría
├─ Arma cantoral completo
├─ Revisa vista previa
└─ Publica cantoral para el domingo 10:00 AM

MARTES - Pueblo Fiel prepara
├─ Fiel inicia sesión
├─ Filtra por su parroquia
├─ Ve cantoral publicado para el domingo
├─ Reproduce "Pescador de Hombres" (Comunión)
├─ Descarga partitura para practicar
└─ Guarda cantoral en favoritos

MIÉRCOLES - Admin agrega canto nuevo
├─ Admin descubre nuevo canto en YouTube
├─ Agrega a la biblioteca con partitura
└─ Notifica al coro (fuera del sistema)

JUEVES - Coro actualiza cantoral
├─ Coro ve nuevo canto disponible
├─ Reemplaza canto de Ofertorio
├─ Cantoral se actualiza automáticamente
└─ Pueblo Fiel ve el cambio

┌─────────────────────────────────────────────────────────────────┐
│                    DOMINGO - DÍA DE LA MISA                     │
└─────────────────────────────────────────────────────────────────┘

09:30 AM - Fieles llegan temprano
├─ Abren app en sus celulares
├─ Ven cantoral del día
├─ Revisan indicaciones posturales
└─ Practican un poco antes de la misa

10:00 AM - Misa comienza
├─ ENTRADA: Fieles cantan "Juntos como Hermanos" (viendo letra en app)
├─ KYRIE: 🧎 De rodillas, cantan Kyrie
├─ GLORIA: 🚶 De pie, cantan Gloria
├─ SALMO: 🪑 Sentados, escuchan salmo
├─ ALELUYA: 🚶 De pie, cantan Aleluya
├─ OFERTORIO: 🪑 Sentados, cantan canto de ofertorio
├─ SANTO: 🚶 De pie, cantan Santo
├─ CORDERO: 🧎 De rodillas, cantan Cordero de Dios
├─ COMUNIÓN: Cantan "Pescador de Hombres" y "Pan de Vida"
└─ SALIDA: 🚶 De pie, cantan canto de despedida

11:00 AM - Post-Misa
├─ Fieles comparten que cantaron mejor
├─ Algunos descargan partituras para ensayar
└─ Coro recibe felicitaciones

LUNES SIGUIENTE
├─ Coro comienza a planificar próxima misa
└─ Ciclo se repite
```

---

## ⚖️ Reglas de Negocio

### RN-01: Restricción de Cantos por Categoría

**Regla:** Solo la categoría "Comunión" permite múltiples cantos. Todas las demás categorías solo permiten UN CANTO.

**Razón Litúrgica:** 
- Durante la Comunión, puede haber varios cantos seguidos mientras los fieles comulgan
- Las demás partes de la misa tienen un momento específico

**Implementación:**
```typescript
if (category !== 'Comunión') {
  // Remover cantos existentes de esta categoría
  const existing = cantoral.filter(s => s.category === category);
  existing.forEach(s => onRemoveFromCantoral(s.id));
}
```

---

### RN-02: Kyrie Agrega Automáticamente Santo y Cordero

**Regla:** Al agregar un Kyrie, se agregan automáticamente el Santo y Cordero de Dios de la misma misa.

**Razón Litúrgica:**
- Estos tres cantos forman parte del Ordinario de la Misa
- Deben ser de la misma misa para mantener coherencia musical

**Implementación:**
```typescript
if (song.category === 'Kyrie' && song.massName) {
  onAddToCantoral(song);
  
  const santo = findSong({ massName: song.massName, category: 'Santo' });
  const cordero = findSong({ massName: song.massName, category: 'Cordero de Dios' });
  
  if (santo) onAddToCantoral(santo);
  if (cordero) onAddToCantoral(cordero);
}
```

---

### RN-03: Gloria es Opcional

**Regla:** Al agregar Kyrie, se pregunta al usuario si desea agregar también el Gloria.

**Razón Litúrgica:**
- El Gloria NO se canta en Adviento y Cuaresma
- El Gloria SÍ se canta en Navidad, Pascua, Domingos y Solemnidades

**Implementación:**
- Se muestra un diálogo preguntando
- El usuario decide según el tiempo litúrgico

---

### RN-04: Aleluya en Cuaresma

**Regla:** Durante la Cuaresma (Miércoles de Ceniza → Viernes Santo), el "Aleluya" se reemplaza por "Aclamación al Evangelio".

**Razón Litúrgica:**
- El Aleluya es un canto de alegría
- Durante Cuaresma se omite por ser tiempo penitencial

**Implementación:**
```typescript
function getGospelAcclamationName(date: Date): string {
  return isLent(date) ? 'Aclamación al Evangelio' : 'Aleluya';
}
```

---

### RN-05: Instrumento Preferido Filtra Resultados

**Regla:** Los cantos del instrumento preferido del coro aparecen primero en las búsquedas.

**Razón Práctica:**
- Facilita que el coro encuentre cantos compatibles con su instrumentación

**Implementación:**
```typescript
const sorted = songs.sort((a, b) => {
  if (a.version === preferredInstrument && b.version !== preferredInstrument) return -1;
  if (a.version !== preferredInstrument && b.version === preferredInstrument) return 1;
  return a.title.localeCompare(b.title);
});
```

---

### RN-06: Cantoral Debe Tener Cantos Mínimos

**Regla (sugerida):** Un cantoral debe tener al menos los cantos esenciales:
- Entrada
- Kyrie o Gloria
- Santo
- Cordero de Dios
- Comunión
- Salida

**Razón Litúrgica:**
- Estos son los momentos principales de la misa
- Sin ellos, el cantoral está incompleto

**Implementación (futura):**
```typescript
function validateCantoral(cantoral: Song[]): string[] {
  const errors = [];
  const categories = cantoral.map(s => s.category);
  
  if (!categories.includes('Entrada')) errors.push('Falta canto de Entrada');
  if (!categories.includes('Santo')) errors.push('Falta Santo');
  if (!categories.includes('Cordero de Dios')) errors.push('Falta Cordero de Dios');
  if (!categories.includes('Comunión')) errors.push('Falta canto de Comunión');
  
  return errors;
}
```

---

## ⚠️ Escenarios de Edge Cases

### EC-01: Usuario Cambia de Rol

**Escenario:** Un usuario era Pueblo Fiel y ahora es miembro del coro.

**Solución:**
1. Usuario va a Settings
2. Usuario solicita cambio de rol a Admin (fuera del sistema)
3. Admin actualiza rol en base de datos
4. Usuario cierra sesión y vuelve a iniciar
5. Sistema carga nuevo rol
6. Usuario ahora ve ChoirView

---

### EC-02: Video de YouTube Eliminado

**Escenario:** Un canto tiene un YouTube ID pero el video fue eliminado.

**Comportamiento Actual:**
- El iframe de YouTube muestra mensaje de error automáticamente

**Mejora Futura:**
- Admin puede actualizar YouTube ID
- Sistema detecta videos no disponibles

---

### EC-03: Cantoral para Fecha Pasada

**Escenario:** Coro intenta publicar cantoral para una fecha que ya pasó.

**Comportamiento:**
- Sistema permite la publicación
- Muestra warning: "Esta fecha ya pasó"
- Útil para archivar cantorales históricos

---

### EC-04: Dos Cantos con Mismo Nombre de Misa

**Escenario:** Admin agrega "Kyrie" de "Misa Criolla" con versión "Guitarra" y "Órgano".

**Comportamiento:**
- Al agregar Kyrie (Guitarra), se agrega Santo y Cordero (Guitarra)
- Al agregar Kyrie (Órgano), se reemplaza todo por versión Órgano
- Mantiene coherencia instrumental

---

### EC-05: Parroquia Sin Cantorales

**Escenario:** Pueblo Fiel de parroquia nueva que no tiene cantorales publicados.

**Comportamiento:**
- Sistema muestra mensaje: "No hay cantorales publicados para tu parroquia"
- Sugiere ver cantorales de otras parroquias
- Sugiere contactar al coro de su parroquia

---

### EC-06: Cuaresma en Transición

**Escenario:** Coro crea cantoral para Domingo de Ramos (último domingo de Cuaresma).

**Comportamiento:**
- Sistema detecta que es Cuaresma
- Muestra "Aclamación al Evangelio" en lugar de "Aleluya"
- Muestra aviso morado explicando

---

### EC-07: Múltiples Coros en Misma Parroquia

**Escenario:** Parroquia tiene Coro de 10 AM y Coro de 18:00.

**Solución:**
- Cada coro publica cantorales con horarios diferentes
- Pueblo Fiel filtra por hora de misa
- Cada cantoral indica claramente la hora

---

### EC-08: Cantoral Muy Largo (Misa Solemne)

**Escenario:** Misa de Navidad con 15+ cantos.

**Comportamiento:**
- Sistema permite agregar todos los cantos necesarios
- Vista previa usa scroll
- Performance optimizada con lazy loading

---

### EC-09: Partitura Demasiado Grande

**Escenario:** Admin intenta subir partitura de 50 MB.

**Comportamiento:**
- Sistema rechaza archivo
- Muestra error: "Archivo muy grande, máximo 10 MB"
- Sugiere comprimir PDF

---

### EC-10: Usuario Sin Conexión a Internet

**Escenario:** Fiel quiere ver cantoral pero no tiene internet en la iglesia.

**Solución Futura:**
- Implementar PWA con service workers
- Cachear cantorales más recientes
- Permitir acceso offline

---

## 🎯 Conclusión

Esta documentación cubre:

✅ **Todos los casos de uso principales** por rol  
✅ **Flujos completos** de principio a fin  
✅ **Reglas de negocio litúrgicas** implementadas  
✅ **Escenarios edge cases** contemplados  

**Para desarrolladores:** Usar estos casos de uso como guía para testing y validación.

**Para product owners:** Usar estos flujos para demos y capacitación de usuarios.
