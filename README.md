# Sistema de Control y Actas Viales — Huillapima

Aplicación para la Dirección de Seguridad Vial (Policía de Catamarca, convenio
Municipalidad de Huillapima) que digitaliza el acta de infracción de tránsito en
papel: carga del acta en guardia, firma digital del infractor y del actuante,
historial y cierre de guardia, y un dashboard mensual de estadísticas y
recaudación.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma ORM 7** sobre **Postgres de Supabase**
- **Supabase Auth** (login por N° de legajo, mapeado a un email interno)
- **Cloudinary** para fotos del vehículo/documentación y firmas digitales
- **Recharts** para el gráfico de evolución de recaudación (resto de gráficos:
  barras HTML/CSS propias, siguiendo el sistema de diseño de
  `sistema_de_control_y_actas_viales_huillapima/DESIGN.md`)
- **Service Worker + IndexedDB** para el modo offline de Nueva Acta (ver
  sección dedicada más abajo)

Las 6 pantallas originales en `*/code.html` (mockups estáticos con Tailwind CDN)
fueron la referencia visual — la app real vive en `src/`.

## Puesta en marcha

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Variables de entorno** — copiá `.env.example` a `.env` y completá:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`: credenciales del
     proyecto de Supabase (Settings → API / Database).
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
     `CLOUDINARY_API_SECRET`: **necesarios para que la subida de fotos y firmas
     funcione**. Sin esto, el acta se guarda igual pero sin la imagen adjunta.
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: preset de subida **sin firmar**
     (unsigned) en Cloudinary — necesario para que las fotos adjuntadas a una
     acta guardada sin conexión se puedan subir directo desde el celular al
     volver la señal, sin pasar por el servidor. Se crea en el panel de
     Cloudinary → Settings → Upload → Upload presets → "Add upload preset",
     con "Signing Mode" en **Unsigned**. Sin esto, el acta offline se
     sincroniza igual pero sin las fotos.
   - `SEED_DEFAULT_PASSWORD`: contraseña con la que se crean los agentes de
     prueba en el seed.
   - `NEXT_PUBLIC_DEVHUB_NOMBRE` / `NEXT_PUBLIC_DEVHUB_URL`: texto y enlace del
     footer "Desarrollado por…". Opcionales, tienen valor por defecto.
   - `NEXT_PUBLIC_NOMBRE_RELEVAMIENTOS`: nombre de la sección de conteos
     (Fines Largos / Día de la Virgen). Opcional, por defecto "Relevamientos".

3. **Base de datos**

   ```bash
   npx prisma generate      # genera el cliente en src/generated/prisma
   npx prisma migrate deploy  # aplica las migraciones versionadas de prisma/migrations
   npx prisma db seed       # crea los puestos, agentes y catálogo de infracciones
   ```

   > Nota Supabase + Prisma 7: el pooler transaccional de Supabase (puerto
   > 6543, `DATABASE_URL`) no soporta los prepared statements que usa el
   > schema engine. `prisma.config.ts` ya apunta el CLI (`migrate`, `generate`,
   > `db seed`) a `DIRECT_URL` (puerto 5432) para evitarlo. La app en runtime
   > (`src/lib/prisma.ts`) sigue usando `DATABASE_URL` (pooled), que es lo
   > correcto para consultas normales.

   **Migraciones:** el schema se versiona con Prisma Migrate (`prisma/migrations/`,
   un `.sql` por cambio, aplicados en orden). Para agregar un cambio de schema:
   editar `prisma/schema.prisma` y correr `npx prisma migrate dev --name <algo>`
   (crea y aplica la migración en un solo paso, en desarrollo). En producción se
   aplican con `prisma migrate deploy`, que nunca pregunta nada ni resetea datos.
   Prisma Migrate no genera un "down" automático: si una migración hay que
   revertirla, se escribe a mano el SQL inverso como una migración nueva.

4. **Correr en desarrollo**

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000). Redirige a `/login`.

## Usuarios de prueba (creados por el seed)

| Legajo | Contraseña | Rol |
|---|---|---|
| `LP-38.904` | valor de `SEED_DEFAULT_PASSWORD` | Jefe (con guardia activa ya iniciada) |
| `LP-44.912` | valor de `SEED_DEFAULT_PASSWORD` | Agente |
| `LP-42.110` | valor de `SEED_DEFAULT_PASSWORD` | Agente |

## Flujo de la app

- `/login` → login por legajo (Supabase Auth por debajo, con email interno
  `legajo@huillapima.local`).
- `/puesto` → elegir el puesto caminero como "contexto de trabajo" de la
  sesión (grilla con los 9 puestos activos). Se guarda en una cookie, no en la
  base — cada dispositivo puede estar en un puesto distinto. Se pide una sola
  vez después del login (si no hay guardia activa) y se puede cambiar en
  cualquier momento desde "(cambiar)" en `/guardia`.
- `/guardia` → menú principal: estado de la guardia activa (o iniciar una en
  el puesto elegido), accesos a Nueva Acta / Actas / Historial / Estadísticas.
- `/actas/nueva` → primero se elige el **tipo de acta**:
  - **Municipal** (Ordenanza 385/12): el formulario de siempre — conductor,
    vehículo, checklist de infracciones tipificadas, liquidación con 40% de
    descuento por pago voluntario.
  - **Contravencional** (Ley Provincial N° 5171/05, Código de Faltas de
    Catamarca): formulario policial aparte, con sus propios campos agrupados
    por sección (vehículo, conductor, "comprobándose", alcoholímetro, medidas
    adoptadas). Los campos salen de la tabla `CampoContravencional` — se
    pueden agregar/renombrar/reordenar sin tocar código (hoy vía
    `prisma/seed.ts`, hasta que llegue el formulario oficial definitivo).
- `/actas/[id]/firma` → resumen legal del acta + firma digital (canvas): el
  acta municipal firma Infractor/Actuante, la contravencional firma
  Conductor/Instructor/Secretario Autorizante (3 firmas, como en el papel).
  Desde acá también: **Editar** (solo mientras está pendiente de firma, el
  agente dueño o un jefe/admin), **Eliminar** (solo jefe/admin, con
  confirmación) y **Exportar PDF** (imprime la página con una hoja de estilos
  dedicada — usa "Guardar como PDF" del diálogo de impresión del navegador).
- `/actas` → listado y búsqueda de actas del turno activo.
- `/guardia/historial` → parte diario del turno y cierre de guardia.
- `/agentes` → solo JEFE/ADMIN: listado del personal a cargo (en guardia,
  actas del mes, pendientes de firma), alta de agentes nuevos con su usuario
  de acceso, edición de datos, restablecer contraseña, dar de baja/reactivar
  y cerrar la guardia de un agente. Un JEFE ve solo a los agentes que dio de
  alta; un ADMIN ve a todos.
- `/estadisticas` → recaudación por día/semana/mes, montos por gravedad,
  ranking de infracciones, vehículos involucrados y edad de los infractores,
  navegable por mes y filtrable por puesto. **La recaudación (recaudación
  del mes, promedios, evolución, montos en $ de gravedad/infracciones/
  vehículos) solo la ven JEFE/ADMIN** — un agente ve las mismas secciones
  pero con cantidades, nunca con montos. Esas queries de recaudación ni
  siquiera se disparan contra la base cuando quien mira es un agente (no es
  solo una cuestión de qué se pinta en pantalla).
- `/requerimientos` → pedidos de captura o secuestro sobre personas o
  vehículos. No depende de una guardia abierta — alcanza con tener un puesto
  elegido. 4 campos de texto libre (Descripción/Identificación, Datos de la
  Orden, Motivo, Observaciones), filtro por tipo, exportar a PDF. Cualquier
  agente carga y edita los suyos; solo jefe/admin edita los de otros y
  elimina (con confirmación).
- `/relevamientos` ("Relevamientos", nombre configurable) → conteos rápidos
  de personas en operativos puntuales, separados de las actas. Dos
  modalidades: **Fines Largos** (cantidad de personas + provincia de
  origen) y **Día de la Virgen** (medio de transporte, sexo y procedencia).
  Tampoco depende de guardia abierta. Panel con totales y desgloses por
  procedencia/medio/sexo, filtrable por puesto. Mismo esquema de permisos
  que Requerimientos.

## Modo offline (Nueva Acta)

Si se corta la señal durante una guardia, el agente puede seguir labrando
**actas municipales nuevas** desde `/actas/nueva?tipo=municipal` — quedan
guardadas en el celular y se sincronizan solas al volver la conexión.

**Alcance** (a propósito, para mantener el riesgo acotado):
- Solo **Nueva Acta municipal**. Requerimientos, Relevamientos, el acta
  contravencional y la edición de actas existentes siguen necesitando señal.
- La firma digital también necesita señal — un acta guardada sin conexión se
  puede firmar recién cuando ya se sincronizó con el servidor.
- Las fotos adjuntas se suben directo a Cloudinary desde el celular (preset
  sin firmar, ver variable de entorno arriba); si no hay preset configurado,
  el acta se sincroniza igual pero sin las fotos.

**Cómo funciona:**
- Un Service Worker (`public/sw.js`) cachea el HTML ya renderizado de
  `/guardia`, `/actas/nueva` y `/actas/nueva?tipo=municipal` — con el
  catálogo de infracciones y los datos de la guardia activa ya incluidos —
  cada vez que la app arranca con señal (`precargarRutasCriticas` en
  `src/lib/offline/precache.ts`), además de cachearlas cuando se visitan
  normalmente. Por eso esas 3 rutas usan `<a>` en vez de `<Link>` en los
  puntos de entrada (tarjeta de "Cargar Nueva Acta", selector de tipo de
  acta, ítems del menú inferior): una transición cliente de Next no pasa
  por el Service Worker, y sin esto la página nunca quedaría cacheada.
- Si al enviar el formulario no hay señal, el acta se guarda en
  **IndexedDB** del navegador (`src/lib/offline/`) en vez de mandarse al
  servidor, con un UUID generado en el celular que va a ser el `Acta.id`
  definitivo (evita duplicados al sincronizar).
- Un indicador fijo arriba de la pantalla (`SincronizadorOffline`) muestra
  cuántas actas quedan pendientes y permite reintentar a mano. Al volver la
  señal, se sincroniza sola.
- **Conflictos:** si dos ediciones del mismo acta llegan por caminos
  distintos (poco probable en este alcance, ya que es solo creación, pero
  cubierto igual), gana la última edición por fecha; la que se descarta
  queda registrada en `ConflictoSincronizacion` para auditoría, no se pierde
  silenciosamente.
- **Dispositivo compartido:** al mostrarse `/login` se borra el cache de
  páginas (no el de archivos estáticos), para que las páginas offline
  cacheadas con los datos de un agente no queden disponibles para el
  siguiente que use el mismo celular.

**Cómo probarlo (Chrome DevTools):**
1. Loguearse y entrar a "Cargar Nueva Acta" → "Acta Municipal" con señal, y
   esperar 2-3 segundos en esa pantalla (para que el Service Worker termine
   de cachear).
2. DevTools → pestaña **Network** → tilde **Offline** (o **Application** →
   **Service Workers** → **Offline**).
3. Recargar la página (F5). Debe seguir viéndose el formulario completo
   (catálogo de infracciones incluido), no un error de conexión.
4. Completar el formulario y enviarlo. Debe aparecer la pantalla "Guardado
   sin conexión" (no el formulario de nuevo ni un error).
5. DevTools → **Application** → **IndexedDB** → `policia-vial-offline` →
   `actas_pendientes`: debe aparecer el acta recién guardada.
6. Volver a tocar "Offline" en Network para sacarlo (reconectar). La barra
   de arriba debe pasar a "Sincronizando…" y después desaparecer.
7. Confirmar en `/actas` que el acta aparece, y que no se duplicó.

## Pendiente / a decisión del equipo

- Revisar y ajustar los montos base de multas del catálogo de infracciones
  (los cargados son valores de referencia, no la tarifa oficial de la
  ordenanza).
- El formulario contravencional usa campos de ejemplo tomados de un acta de
  comprobación provincial — cuando llegue el formato oficial definitivo,
  ajustar `CampoContravencional` (sin tocar código).
- La búsqueda de `/actas` busca por los campos del acta municipal
  (conductor/DNI/dominio); no busca todavía dentro de los datos de la
  contravencional (quedan en JSON).
- Cargar los agentes reales (hoy solo hay 3 legajos de prueba, ver tabla más
  arriba). Los 9 puestos ya están cargados: Base Vial y Tango 50 a 57
  (nombres de ejemplo — para cambiarlos hoy se edita `prisma/seed.ts` y se
  vuelve a correr `npx prisma db seed`; los agentes ya se dan de alta desde
  `/agentes`, sin tocar código).
- El modo offline (ver sección "Modo offline" arriba) solo cubre Nueva Acta
  municipal. Si más adelante hace falta offline para requerimientos,
  relevamientos, el acta contravencional o la firma, es una extensión del
  mismo mecanismo (IndexedDB + Service Worker), no un enfoque nuevo.
- La restricción de recaudación a jefe/admin está en el código del servidor
  (Server Components/Actions), no en políticas RLS de Postgres — ya
  documentado como decisión de arquitectura: no hay ningún otro camino a la
  base (ni API pública ni acceso directo vía `supabase-js`), así que esto
  cubre el 100% de los accesos reales de la app.
- Sin tests automatizados.

Cloudinary ya está configurado y probado (subida de fotos y firmas
funcionando) — solo falta que cada quien complete sus propias credenciales en
`.env` si levanta el proyecto de cero.
