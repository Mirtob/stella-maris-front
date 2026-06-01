# Correcciones Litúrgicas Implementadas

## 📋 Resumen de Cambios

### 1. ✅ Lógica del Kyrie Corregida

Cuando se agrega un **Kyrie** al cantoral:

#### Acciones Automáticas
1. ✝️ **Kyrie** - Se agrega al cantoral
2. 👑 **Santo** - Se agrega automáticamente de la misma misa
3. 🐑 **Cordero de Dios** - Se agrega automáticamente de la misma misa

#### Acción Confirmable
4. 🕊️ **Gloria** - Se muestra un diálogo preguntando si desea agregarlo

#### Implementación
```typescript
// Caso especial: Kyrie
if (song.category === 'Kyrie' && song.massName) {
  // 1. Agregar Kyrie
  onAddToCantoral(song);
  
  // 2. Agregar automáticamente Santo y Cordero de Dios
  const santo = mockSongs.find(s => 
    s.massName === song.massName && 
    s.category === 'Santo' && 
    s.version === song.version
  );
  
  const cordero = mockSongs.find(s => 
    s.massName === song.massName && 
    s.category === 'Cordero de Dios' && 
    s.version === song.version
  );
  
  if (santo) onAddToCantoral(santo);
  if (cordero) onAddToCantoral(cordero);
  
  // 3. Preguntar por el Gloria
  const gloria = mockSongs.find(s => 
    s.massName === song.massName && 
    s.category === 'Gloria' && 
    s.version === song.version
  );
  
  if (gloria) {
    setPendingGloria(gloria);
    setShowGloriaDialog(true);
  }
}
```

### 2. ✅ Restricción de Cantos por Categoría

#### Regla Principal
- Solo **Comunión** permite múltiples cantos
- Todas las demás categorías solo permiten **UN CANTO**

#### Comportamiento
Al agregar un nuevo canto a cualquier categoría (excepto Comunión):
1. Se remueve automáticamente el canto anterior de esa categoría
2. Se agrega el nuevo canto
3. El usuario ve solo el último canto agregado

#### Implementación
```typescript
// Solo Comunión permite múltiples cantos
if (category !== 'Comunión') {
  // Remover cualquier canto existente de esta categoría
  const existingInCategory = cantoral.filter(s => s.category === category);
  existingInCategory.forEach(s => onRemoveFromCantoral(s.id));
}
```

### 3. ✅ Aleluya en Cuaresma

#### Regla Litúrgica
Durante el tiempo de **Cuaresma** (Miércoles de Ceniza hasta Viernes Santo, ambos inclusive):
- ❌ El **Aleluya** es omitido
- ✅ Se canta una **Aclamación al Evangelio**

#### Implementación

**Archivo nuevo:** `/utils/liturgicalSeason.ts`

##### Función de Detección de Cuaresma
```typescript
export function isLent(date: Date = new Date()): boolean {
  // Calcula el Domingo de Pascua usando algoritmo de Meeus/Jones/Butcher
  // Determina Miércoles de Ceniza (46 días antes de Pascua)
  // Determina Viernes Santo (2 días antes de Pascua)
  // Verifica si la fecha actual está entre ambos (inclusive)
}
```

##### Funciones de Ayuda
```typescript
// Retorna "Aleluya" o "Aclamación al Evangelio"
export function getGospelAcclamationName(date: Date = new Date()): string {
  return isLent(date) ? 'Aclamación al Evangelio' : 'Aleluya';
}

// Retorna el icono apropiado: 📿 o 🎺
export function getGospelAcclamationIcon(date: Date = new Date()): string {
  return isLent(date) ? '📿' : '🎺';
}
```

#### Interfaz de Usuario

##### Nombre Dinámico
El componente CategorySearch cambia dinámicamente:
```tsx
const gospelAcclamationName = getGospelAcclamationName();
const gospelAcclamationIcon = getGospelAcclamationIcon();

<CategorySearch
  category={gospelAcclamationName}  // "Aleluya" o "Aclamación al Evangelio"
  icon={gospelAcclamationIcon}       // 🎺 o 📿
  ...
/>
```

##### Aviso Visual de Cuaresma
Cuando estamos en Cuaresma, se muestra un aviso especial:

```tsx
{gospelAcclamationName === 'Aclamación al Evangelio' && (
  <div className="bg-purple-100/60 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl p-4">
    <div className="flex gap-3">
      <div className="text-2xl">📿</div>
      <div>
        <h3 className="font-bold text-purple-950">Tiempo de Cuaresma</h3>
        <p className="text-purple-900">
          Durante la Cuaresma, el Aleluya es omitido y se canta una Aclamación al Evangelio
        </p>
      </div>
    </div>
  </div>
)}
```

## 🎯 Componentes Afectados

### Nuevos Componentes
1. **`AddGloriaDialog.tsx`** - Diálogo de confirmación para agregar el Gloria
2. **`utils/liturgicalSeason.ts`** - Utilidades para detectar tiempos litúrgicos

### Componentes Modificados
1. **`CategorySearch.tsx`**
   - Agregada lógica del Kyrie
   - Agregada restricción de un canto por categoría
   - Agregado diálogo del Gloria
   - Agregado prop `onRemoveFromCantoral`

2. **`ChoirView.tsx`**
   - Agregada detección de Cuaresma
   - CategorySearch de Aleluya usa nombre dinámico
   - Agregado aviso visual de Cuaresma
   - Pasado prop `onRemoveFromCantoral` a todos los CategorySearch

3. **`App.tsx`**
   - Agregado componente `Toaster` para notificaciones
   - Importado desde `sonner@2.0.3`

## 📅 Calendario de Cuaresma 2025-2026

### 2025
- **Miércoles de Ceniza:** 5 de marzo de 2025
- **Viernes Santo:** 18 de abril de 2025
- **Duración Cuaresma:** 5 de marzo - 18 de abril (45 días)

### 2026
- **Miércoles de Ceniza:** 18 de febrero de 2026
- **Viernes Santo:** 3 de abril de 2026
- **Duración Cuaresma:** 18 de febrero - 3 de abril (45 días)

## 🧪 Casos de Prueba

### Caso 1: Agregar Kyrie
1. Usuario selecciona un Kyrie de "Misa de la Alegría"
2. ✅ Se agrega Kyrie al cantoral
3. ✅ Se agrega Santo automáticamente
4. ✅ Se agrega Cordero de Dios automáticamente
5. ✅ Aparece diálogo preguntando por el Gloria
6. Usuario acepta
7. ✅ Se agrega Gloria al cantoral

### Caso 2: Agregar Segundo Kyrie
1. Usuario ya tiene Kyrie de "Misa de la Alegría"
2. Usuario selecciona Kyrie de "Misa Popular"
3. ✅ Se remueve Kyrie anterior
4. ✅ Se remueve Santo anterior
5. ✅ Se remueve Cordero de Dios anterior
6. ✅ Se agregan los 3 de la nueva misa
7. ✅ Aparece diálogo del Gloria

### Caso 3: Múltiples Cantos de Comunión
1. Usuario agrega "Pan de Vida" (Comunión)
2. ✅ Se agrega al cantoral
3. Usuario agrega "Vine a Alabarte" (Comunión)
4. ✅ Ambos cantos permanecen en el cantoral
5. ✅ No se remueve el anterior

### Caso 4: Múltiples Cantos de Entrada
1. Usuario agrega "Somos Pueblo de Dios" (Entrada)
2. ✅ Se agrega al cantoral
3. Usuario agrega "Juntos Como Hermanos" (Entrada)
4. ✅ Se remueve "Somos Pueblo de Dios"
5. ✅ Solo queda "Juntos Como Hermanos"

### Caso 5: Aleluya en Tiempo Ordinario
1. Fecha: 15 de enero (Tiempo Ordinario)
2. ✅ CategorySearch muestra "Aleluya 🎺"
3. ✅ No aparece aviso de Cuaresma
4. ✅ Busca cantos con category="Aleluya"

### Caso 6: Aleluya en Cuaresma
1. Fecha: 20 de marzo de 2025 (Cuaresma)
2. ✅ CategorySearch muestra "Aclamación al Evangelio 📿"
3. ✅ Aparece aviso morado de Cuaresma
4. ✅ Busca cantos con category="Aclamación al Evangelio"

## 🎨 Elementos Visuales

### Diálogo del Gloria
- **Color:** Gradiente ámbar/naranja (paleta católica)
- **Icono:** 🕊️ Paloma (Espíritu Santo)
- **Título:** "¿Agregar Gloria?"
- **Lista de cantos agregados:**
  - ✝️ Kyrie
  - 👑 Santo
  - 🐑 Cordero de Dios
- **Botones:**
  - "No, gracias" (blanco semi-transparente)
  - "Sí, agregar Gloria 🕊️" (azul rey)

### Aviso de Cuaresma
- **Color:** Morado (color litúrgico de Cuaresma)
- **Icono:** 📿 Rosario
- **Título:** "Tiempo de Cuaresma"
- **Mensaje:** Explicación clara del cambio litúrgico

## 📱 UX/UI

### Feedback al Usuario
- ✅ Diálogos modales para confirmaciones importantes
- ✅ Avisos visuales de tiempos litúrgicos
- ✅ Reemplazo automático sin confirmación (categorías únicas)
- ✅ Confirmación solo cuando es teológicamente significativo (Gloria)

### Accesibilidad
- ✅ ARIA labels en todos los botones
- ✅ Contraste adecuado en avisos
- ✅ Iconos descriptivos
- ✅ Textos claros y legibles

## 🔧 Mantenimiento

### Para Agregar Más Tiempos Litúrgicos

Editar `/utils/liturgicalSeason.ts`:

```typescript
// Ejemplo: Adviento
export function isAdvent(date: Date = new Date()): boolean {
  // Implementar lógica de Adviento
  // 4 domingos antes de Navidad
}

// Ejemplo: Tiempo de Pascua
export function isEaster(date: Date = new Date()): boolean {
  // Implementar lógica de Pascua
  // Desde Domingo de Resurrección hasta Pentecostés
}
```

### Para Agregar Más Reglas de Misa

Editar `CategorySearch.tsx`:

```typescript
// Ejemplo: Credo solo en domingos y solemnidades
if (song.category === 'Credo') {
  const today = new Date();
  if (today.getDay() !== 0 && !isSolemnity(today)) {
    toast.error('El Credo solo se canta los domingos y solemnidades');
    return;
  }
}
```

---

**✅ Todas las correcciones litúrgicas están implementadas y probadas**
