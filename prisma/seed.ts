import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { createAdminClient } from "../src/lib/supabase/admin";
import { legajoToEmail } from "../src/lib/auth";

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? "Devhub123!";

async function asegurarUsuarioAuth(email: string, password: string) {
  const admin = createAdminClient();

  const { data: creado, error: errorCrear } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (!errorCrear) return creado.user!.id;

  // Ya existe: lo buscamos por email entre los usuarios registrados.
  const { data: lista, error: errorListar } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (errorListar) throw errorListar;

  const existente = lista.users.find((u) => u.email === email);
  if (!existente) throw errorCrear;
  return existente.id;
}

async function main() {
  console.log("Sembrando Puesto Caminero…");
  const puesto = await prisma.puesto.upsert({
    where: { id: "puesto-nueva-coneta" },
    update: {},
    create: {
      id: "puesto-nueva-coneta",
      nombre: "Puesto Caminero Nueva Coneta",
      kmRuta: "Ruta Prov. 14 / RN 38 Km 572",
      ubicacion: "Huillapima, Capayán, Catamarca",
    },
  });

  console.log("Sembrando agentes…");
  const agentesSeed = [
    {
      legajo: "LP-38.904",
      nombreApellido: "Gómez, Lucas",
      grado: "Of. Subinsp.",
      rol: "JEFE" as const,
    },
    {
      legajo: "LP-44.912",
      nombreApellido: "Bazán, Sergio",
      grado: "Oficial Inspector",
      rol: "AGENTE" as const,
    },
    {
      legajo: "LP-42.110",
      nombreApellido: "Delgado, Martín",
      grado: "Oficial",
      rol: "AGENTE" as const,
    },
  ];

  const agentes = [];
  for (const a of agentesSeed) {
    const authEmail = legajoToEmail(a.legajo);
    await asegurarUsuarioAuth(authEmail, DEFAULT_PASSWORD);
    const agente = await prisma.agente.upsert({
      where: { legajo: a.legajo },
      update: { nombreApellido: a.nombreApellido, grado: a.grado, rol: a.rol },
      create: { ...a, authEmail },
    });
    agentes.push(agente);
    console.log(`  · ${a.legajo} -> ${authEmail}`);
  }

  console.log("Sembrando catálogo de infracciones…");
  const catalogo = [
    // Documentación
    { categoria: "DOCUMENTACION", descripcion: "Conducir Sin Licencia", gravedad: "GRAVE", montoBase: 25000, orden: 1 },
    { categoria: "DOCUMENTACION", descripcion: "Conducir Sin Cédula Verde", gravedad: "LEVE", montoBase: 8000, orden: 2 },
    { categoria: "DOCUMENTACION", descripcion: "Conducir Sin Seguro Obligatorio", gravedad: "GRAVE", montoBase: 22000, orden: 3 },
    { categoria: "DOCUMENTACION", descripcion: "Conducir Sin Casco Protector", gravedad: "GRAVE", montoBase: 20000, orden: 4 },
    { categoria: "DOCUMENTACION", descripcion: "Sin Chapa Patente Visible / Reglamentaria", gravedad: "LEVE", montoBase: 9000, orden: 5 },
    { categoria: "DOCUMENTACION", descripcion: "Sin Portar Documentación Completa", gravedad: "LEVE", montoBase: 7000, orden: 6 },
    // Estado del rodado
    { categoria: "ESTADO_RODADO", descripcion: "Luces Reglamentarias Deficientes / Apagadas", gravedad: "LEVE", montoBase: 8000, orden: 7 },
    { categoria: "ESTADO_RODADO", descripcion: "No Usar Cinturón de Seguridad", gravedad: "LEVE", montoBase: 9000, orden: 8 },
    { categoria: "ESTADO_RODADO", descripcion: "Sin Espejos Retrovisores", gravedad: "LEVE", montoBase: 7000, orden: 9 },
    { categoria: "ESTADO_RODADO", descripcion: "Caño de Escape Libre / No Homologado", gravedad: "LEVE", montoBase: 7500, orden: 10 },
    // Alcoholemia y conducta
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Estado de Ebriedad / Efecto Estupefacientes", gravedad: "GRAVISIMA", montoBase: 60000, orden: 11 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Negarse a Procedimiento de Alcoholemia", gravedad: "GRAVISIMA", montoBase: 55000, orden: 12 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "En Sentido Contrario a las Señalizaciones", gravedad: "GRAVE", montoBase: 30000, orden: 13 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Cruzar Semáforo en Luz Roja", gravedad: "GRAVE", montoBase: 25000, orden: 14 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Conductor Menor de Edad", gravedad: "GRAVE", montoBase: 20000, orden: 15 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Darse a la Fuga / Desobediencia", gravedad: "GRAVISIMA", montoBase: 65000, orden: 16 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Desconocer a la Autoridad Competente", gravedad: "GRAVISIMA", montoBase: 50000, orden: 17 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Poner en Riesgo la Seguridad Propia y/o Terceros", gravedad: "GRAVISIMA", montoBase: 45000, orden: 18 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Consignar Datos Falsos", gravedad: "GRAVISIMA", montoBase: 40000, orden: 19 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Documentación Adulterada", gravedad: "GRAVISIMA", montoBase: 45000, orden: 20 },
    { categoria: "ALCOHOLEMIA_CONDUCTA", descripcion: "Estacionar en Lugares Prohibidos", gravedad: "LEVE", montoBase: 6000, orden: 21 },
    { categoria: "OTRA", descripcion: "Otra Infracción / Detalle Operativo", gravedad: "LEVE", montoBase: 0, orden: 22 },
  ] as const;

  for (const item of catalogo) {
    const existente = await prisma.infraccionCatalogo.findFirst({
      where: { descripcion: item.descripcion },
    });
    if (existente) {
      await prisma.infraccionCatalogo.update({
        where: { id: existente.id },
        data: item,
      });
    } else {
      await prisma.infraccionCatalogo.create({ data: item });
    }
  }

  console.log("Abriendo guardia activa de ejemplo…");
  const jefe = agentes[0];
  const guardiaActiva = await prisma.guardia.findFirst({
    where: { agenteId: jefe.id, estado: "ACTIVA" },
  });
  if (!guardiaActiva) {
    await prisma.guardia.create({
      data: { agenteId: jefe.id, puestoId: puesto.id },
    });
  }

  console.log("Listo. Usuarios de prueba:");
  for (const a of agentesSeed) {
    console.log(`  Legajo: ${a.legajo}  Contraseña: ${DEFAULT_PASSWORD}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
