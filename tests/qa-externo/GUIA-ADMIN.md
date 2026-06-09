# Guía para Tester con Permisos de Administrador

> Esta guía es solo para quienes recibieron las credenciales de administrador.
> Si no te dieron credenciales de admin, usá `GUIA-TESTER.md`.

## ¿Qué probás?

El **Panel Administrativo** de Stella Maris. Vas a ver datos reales de usuarios,
parroquias y cantos. Tu rol es como el de un encargado que verifica que todo
esté ordenado y funcione.

## Antes de empezar

- Celular o computadora con internet
- Cuenta de Google con permisos de admin (te la dirá el desarrollador)
- 20 a 30 minutos
- Esta guía al lado para ir marcando

---

## 🛡️ Parte 1 — Entrar como Admin

**Qué hacer:**
1. Abrí el link de la app: **`______________________`**
2. Tocá "Iniciar sesión con Google".
3. Elegí la cuenta admin que te dieron.

**Qué debería pasar:**
- Entrás directo al inicio del panel.
- **NO te pregunta parroquia** (el admin no necesita).
- En el menú lateral aparece "Panel Admin".
- Tu rol arriba dice "Admin".

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

---

## 🛡️ Parte 2 — Ver todos los cantorales (de todas las parroquias)

**Qué hacer:**
1. En el menú lateral, tocá "Cantorales Publicados".
2. Mirá la lista.

**Qué debería pasar:**
- Aparecen cantorales de **TODAS las parroquias** (no solo una).
- Cada cantoral muestra la parroquia, fecha, hora y cantos.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

---

## 🛡️ Parte 3 — Panel Administrativo

### 3.1 — Entrar al Panel

**Qué hacer:**
1. En el menú lateral, tocá **"Panel Admin"**.

**Qué debería pasar:**
- Aparece una pantalla con varias opciones (Usuarios, Parroquias, Cantos, Sincronizar YouTube, Migrar Catálogo).

**☐ Funcionó / ☐ Tuvo problemas**

### 3.2 — Gestión de Usuarios

**Qué hacer:**
1. Tocá **"Gestión de Usuarios"**.
2. Mirá la lista de usuarios registrados.
3. Tocá el botón **Refrescar desde Supabase**.
4. Buscá un usuario por nombre (con o sin tildes).
5. Cambiá el rol de algún usuario con el dropdown (por ejemplo, de "Pueblo fiel" a "Coro").
6. Refrescá y mirá si el cambio se guardó.
7. Tratá de borrar el perfil de algún usuario de prueba — confirmá cuando te pregunte.

**Qué debería pasar:**
- La lista muestra usuarios reales (los que ya se logueraron a la app alguna vez).
- La búsqueda funciona con o sin acentos.
- Cambiar el rol muestra un mensaje verde "Rol actualizado".
- Eliminar pide confirmación, después desaparece de la lista.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

### 3.3 — Gestión de Parroquias

**Qué hacer:**
1. Tocá **"Gestión de Parroquias"**.
2. Mirá el panel verde **"Parroquias activas en la app"** arriba.
3. Tocá refrescar.
4. Más abajo, mirá el catálogo de parroquias de Chile.

**Qué debería pasar:**
- En el panel verde aparecen las parroquias que tienen actividad real:
  cuántos usuarios y cuántos cantorales tiene cada una.
- El catálogo de Chile muestra las diócesis y parroquias para edición.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

### 3.4 — Gestión de Cantos

**Qué hacer:**
1. Tocá **"Gestión de Cantos"**.
2. Mirá la lista de cantos del catálogo.
3. Buscá un canto por título (con o sin tilde).
4. Filtrá por categoría (Entrada, Comunión, etc.).
5. Mirá las estadísticas abajo.
6. Tratá de eliminar un canto de prueba — confirmá cuando te pregunte.

**Qué debería pasar:**
- Los cantos del catálogo aparecen con título, autor, categoría, ID de YouTube y si tiene partitura.
- Búsqueda con acentos funciona.
- Filtro por categoría reduce la lista.
- Eliminar muestra confirmación antes de borrar definitivamente.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

### 3.5 — Sincronizar con YouTube

> ⚠️ Solo probar si tenés permiso del desarrollador. Esta función conecta
> con el canal real de YouTube de la app.

**Qué hacer:**
1. Tocá **"Sincronizar YouTube"**.
2. Leé las instrucciones.
3. Tocá **"Sincronizar ahora"**.
4. Esperá unos segundos.

**Qué debería pasar:**
- Aparece un mensaje de carga.
- Cuando termina, muestra un resumen: cuántos cantos nuevos se agregaron, cuántos ya existían.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

---

## 🛡️ Parte 4 — Eliminar un cantoral de cualquier parroquia

**Qué hacer:**
1. Volvé al menú lateral y tocá "Historial de Cantorales".
2. Buscá un cantoral de prueba (cualquier parroquia).
3. Tocá el botón rojo de eliminar.
4. Confirmá cuando te pregunte.

**Qué debería pasar:**
- Como admin podés borrar cantorales de cualquier coro (no solo los tuyos).
- Pide confirmación antes de borrar.
- Después de borrar, desaparece de la lista.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

---

## 🛡️ Parte 5 — Cambiar de perfil temporalmente

**Qué hacer:**
1. En el menú lateral, tocá el botón rojo "Cambiar perfil".
2. Aparece un dialog con 3 opciones: **Como Coro / Como Pueblo fiel / Como Administrador**.
3. Elegí "Como Pueblo fiel" y alguna parroquia.

**Qué debería pasar:**
- Entrás a la vista de Pueblo fiel pero seguís siendo admin (cuando vuelvas a "Cambiar perfil" volvés a verte como admin).
- En el menú lateral aparece "(sesión)" al lado del rol cuando estás actuando como otro perfil.

**☐ Funcionó / ☐ Tuvo problemas**

**Qué me pareció:**
> _____________________________________________________________________

---

## 🛡️ Parte 6 — Tu opinión general

### A. ¿El panel de admin se entendió fácil?

> _____________________________________________________________________

### B. ¿Faltaba alguna función que esperabas encontrar?

> _____________________________________________________________________

### C. ¿Algo no funcionó? Describilo con detalle.

> _____________________________________________________________________
> _____________________________________________________________________

### D. ¿En qué dispositivo lo probaste?

| Marca/modelo | _________________ |
| Sistema (Android/iPhone/Web) | _________________ |
| Navegador | _________________ |

### E. Fecha de prueba

> _____________________________________________________________________

---

## ¡Gracias!

Tu rol es clave porque ves el sistema desde adentro. Si encontraste cualquier
cosa rara — datos que no debían estar, botones que no responden, errores
extraños — **comentá todo, hasta lo que parezca menor**.

Mandanos esto a: **`______________________`**
