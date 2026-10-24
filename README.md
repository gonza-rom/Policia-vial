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
   - `SEED_DEFAULT_PASSWORD`: contraseña con la que se crean los agentes de
     prueba en el seed.
   - `NEXT_PUBLIC_DEVHUB_NOMBRE` / `NEXT_PUBLIC_DEVHUB_URL`: texto y enlace del
     footer "Desarrollado por…". Opcionales, tienen valor por defecto.

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
- `/actas/nueva` → formulario completo del acta (conductor, vehículo,
  checklist de infracciones tipificadas, liquidación con 40% de descuento por
  pago voluntario).
- `/actas/[id]/firma` → resumen legal del acta + firma digital (canvas) del
  infractor y del actuante, opción "se niega a firmar", cierre del acta.
- `/actas` → listado y búsqueda de actas del turno activo.
- `/guardia/historial` → parte diario del turno y cierre de guardia.
- `/agentes` → solo JEFE/ADMIN: listado del personal a cargo (en guardia,
  actas del mes, pendientes de firma), alta de agentes nuevos con su usuario
  de acceso, edición de datos, restablecer contraseña, dar de baja/reactivar
  y cerrar la guardia de un agente. Un JEFE ve solo a los agentes que dio de
  alta; un ADMIN ve a todos.
- `/estadisticas` → recaudación por día/semana/mes, montos por gravedad,
  ranking de infracciones, vehículos involucrados y edad de los infractores,
  navegable por mes.

## Pendiente / a decisión del equipo

- Revisar y ajustar los montos base de multas del catálogo de infracciones
  (los cargados son valores de referencia, no la tarifa oficial de la
  ordenanza).
- Cargar los agentes reales (hoy solo hay 3 legajos de prueba, ver tabla más
  arriba). Los 9 puestos ya están cargados: Base Vial y Tango 50 a 57
  (nombres de ejemplo — para cambiarlos hoy se edita `prisma/seed.ts` y se
  vuelve a correr `npx prisma db seed`; los agentes ya se dan de alta desde
  `/agentes`, sin tocar código).
- No hay modo offline/PWA — requiere conexión a internet (decisión tomada al
  planificar el proyecto, para mantener el alcance manejable).
- Sin tests automatizados.

Cloudinary ya está configurado y probado (subida de fotos y firmas
funcionando) — solo falta que cada quien complete sus propias credenciales en
`.env` si levanta el proyecto de cero.
