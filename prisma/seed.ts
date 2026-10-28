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
  console.log("Sembrando puestos…");
  // El puesto original de desarrollo queda inactivo (no forma parte de los
  // 9 puestos reales) pero no se borra: hay actas/guardias de prueba que
  // referencian su id.
  await prisma.puesto.upsert({
    where: { id: "puesto-nueva-coneta" },
    update: { activo: false },
    create: {
      id: "puesto-nueva-coneta",
      nombre: "Puesto Caminero Nueva Coneta",
      kmRuta: "Ruta Prov. 14 / RN 38 Km 572",
      ubicacion: "Huillapima, Capayán, Catamarca",
      activo: false,
    },
  });

  // Coordenadas provistas por la Dirección (28 oct 2026) y reglas de acceso
  // a actas municipales por jurisdicción: solo Base Vial, Tango 51 y
  // Tango 53 tienen jurisdicción municipal habitual; el resto no accede a
  // acta municipal salvo que trabajen bajo modalidad OTRA_JURISDICCION.
  const puestosSeed = [
    { nombre: "Base Vial", ubicacion: "Las Rejas", lat: -28.469296919831947, lng: -65.82468969420398, jurisdicciones: ["CAPITAL"] as const },
    { nombre: "Tango 50", ubicacion: "El Portezuelo", lat: -28.498509600657247, lng: -65.60866306325029, jurisdicciones: [] as const },
    { nombre: "Tango 51", ubicacion: "Nueva Coneta", lat: -28.55152151162221, lng: -65.8312951018282, jurisdicciones: ["CAPITAL", "HUILLAPIMA"] as const },
    { nombre: "Tango 52", ubicacion: "Sumalao", lat: -28.592606267478608, lng: -65.75821113299423, jurisdicciones: [] as const },
    { nombre: "Tango 53", ubicacion: "La Puerta", lat: -28.19388, lng: -65.770447, jurisdicciones: ["LA_PUERTA"] as const },
    { nombre: "Tango 54", ubicacion: "La Atravesada, Balcozna", lat: -27.838041329131357, lng: -65.78247381905491, jurisdicciones: [] as const },
    { nombre: "Tango 55", ubicacion: "Las Salinas, referencias 157 y 60", lat: -29.511015778037514, lng: -64.92065009294869, jurisdicciones: [] as const },
    { nombre: "Tango 56", ubicacion: "El Clavillo, Aconquija", lat: -27.346150633985534, lng: -65.97125014673429, jurisdicciones: [] as const },
    { nombre: "Tango 57", ubicacion: "La Viña, Ruta 38, antes de Huacra", lat: -28.005090960815874, lng: -65.58027437622454, jurisdicciones: [] as const },
  ];
  const puestos = [];
  for (const [i, p] of puestosSeed.entries()) {
    const id = `puesto-${p.nombre.toLowerCase().replace(/\s+/g, "-")}`;
    const codigo = p.nombre.toUpperCase().replace(/\s+/g, "-");
    const data = {
      nombre: p.nombre,
      orden: i,
      codigo,
      ubicacion: p.ubicacion,
      latitud: p.lat,
      longitud: p.lng,
      jurisdiccionesMunicipales: [...p.jurisdicciones],
    };
    const creado = await prisma.puesto.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
    puestos.push(creado);
  }
  const puesto = puestos[0];

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

  // Los agentes de prueba quedan a cargo del jefe (pantalla /agentes).
  const jefeSeed = agentes.find((a) => a.rol === "JEFE")!;
  await prisma.agente.updateMany({
    where: { id: { in: agentes.filter((a) => a.rol === "AGENTE").map((a) => a.id) } },
    data: { jefeId: jefeSeed.id },
  });

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

  console.log("Sembrando esquema del acta contravencional…");
  const campos = [
    { clave: "fecha", etiqueta: "Fecha del Acta", seccion: "Fecha y Hora", tipo: "FECHA", orden: -2, requerido: true },
    { clave: "hora", etiqueta: "Hora del Acta", seccion: "Fecha y Hora", tipo: "HORA", orden: -1, requerido: true },

    { clave: "vehiculo", etiqueta: "Vehículo", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 1, requerido: true },
    { clave: "marca", etiqueta: "Marca", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 2 },
    { clave: "modelo", etiqueta: "Modelo", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 3 },
    { clave: "tipoVehiculo", etiqueta: "Tipo", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 4 },
    { clave: "dominio", etiqueta: "Dominio", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 5, requerido: true },
    { clave: "color", etiqueta: "Color", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 6 },
    { clave: "titular", etiqueta: "Titular", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 7 },
    { clave: "domicilioVehiculo", etiqueta: "Domicilio", seccion: "Datos del Vehículo", tipo: "TEXTO", orden: 8 },

    { clave: "conductorNombre", etiqueta: "Conducido por el Ciudadano", seccion: "Datos del Conductor", tipo: "TEXTO", orden: 9, requerido: true },
    { clave: "instruccion", etiqueta: "Con o Sin Instrucción", seccion: "Datos del Conductor", tipo: "SELECT", opciones: ["Con Instrucción", "Sin Instrucción"] as string[], orden: 10 },
    { clave: "profesion", etiqueta: "Profesión", seccion: "Datos del Conductor", tipo: "TEXTO", orden: 11 },
    { clave: "domicilioConductor", etiqueta: "Domiciliado en", seccion: "Datos del Conductor", tipo: "TEXTO", orden: 12 },
    { clave: "dni", etiqueta: "D.N.I. N°", seccion: "Datos del Conductor", tipo: "TEXTO", orden: 13, requerido: true },
    { clave: "licenciaNro", etiqueta: "Licencia de Conducir N°", seccion: "Datos del Conductor", tipo: "TEXTO", orden: 14 },
    { clave: "licenciaExpedidaPor", etiqueta: "Expedida por", seccion: "Datos del Conductor", tipo: "TEXTO", orden: 15 },

    { clave: "comprobandose", etiqueta: "Comprobándose", seccion: "Comprobándose", tipo: "TEXTO_LARGO", orden: 16, requerido: true },
    { clave: "articulosProvinciales", etiqueta: "Infracción al/los Artículos (Ley Provincial N° 5171)", seccion: "Comprobándose", tipo: "TEXTO", orden: 17 },
    { clave: "articulosNacionales", etiqueta: "En Concordancia con Artículos (Ley Nacional N° 24.449)", seccion: "Comprobándose", tipo: "TEXTO", orden: 18 },

    { clave: "alcoholimetroMarca", etiqueta: "Marca", seccion: "Datos del Alcoholímetro", tipo: "TEXTO", orden: 19 },
    { clave: "alcoholimetroTipoNumero", etiqueta: "Tipo y Número", seccion: "Datos del Alcoholímetro", tipo: "TEXTO", orden: 20 },
    { clave: "primeraLectura", etiqueta: "Primera Lectura", seccion: "Datos del Alcoholímetro", tipo: "TEXTO", orden: 21 },
    { clave: "segundaLectura", etiqueta: "Segunda Lectura", seccion: "Datos del Alcoholímetro", tipo: "TEXTO", orden: 22 },

    { clave: "medidasAdoptadas", etiqueta: "Medidas Adoptadas con el Conductor (Art. 48° Código de Faltas)", seccion: "Medidas y Circunstancias", tipo: "TEXTO_LARGO", orden: 23 },
    { clave: "otrasCircunstancias", etiqueta: "Otras Circunstancias", seccion: "Medidas y Circunstancias", tipo: "TEXTO_LARGO", orden: 24 },
    { clave: "nota", etiqueta: "Nota", seccion: "Medidas y Circunstancias", tipo: "TEXTO_LARGO", orden: 25 },
  ] as const;

  for (const campo of campos) {
    await prisma.campoContravencional.upsert({
      where: { clave: campo.clave },
      update: campo,
      create: campo,
    });
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
