import 'reflect-metadata';
import mongoose, { Types } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { Usuario, UsuarioSchema } from '../schemas/Usuario.schema';
import { Archivo, ArchivoSchema } from '../schemas/Archivo.schema';
import { Carpeta, CarpetaSchema } from '../schemas/Carpeta.schema';
import {
  Actividad,
  ActividadSchema,
  Accion,
  TipoRecurso,
} from '../schemas/Actividad.schema';
import { PermissionType } from '../schemas/PermisosDoc.schema';
import { Role } from '../common/enums/rol.enum';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27018/backend';

const UsuarioModel = mongoose.model(Usuario.name, UsuarioSchema);
const ArchivoModel = mongoose.model(Archivo.name, ArchivoSchema);
const CarpetaModel = mongoose.model(Carpeta.name, CarpetaSchema);
const ActividadModel = mongoose.model(Actividad.name, ActividadSchema);

type CarpetaSeed = {
  _id: Types.ObjectId;
  name: string;
  parentFolder: Types.ObjectId | null;
  ancestors: Types.ObjectId[];
  owner: Types.ObjectId;
  size: number;
  shareWith: { user: Types.ObjectId; permissions: PermissionType[] }[];
  comentarios: unknown[];
  inTrash: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ArchivoSeed = {
  _id: Types.ObjectId;
  name: string;
  type: string;
  parentFolder: Types.ObjectId | null;
  ancestors: Types.ObjectId[];
  size: number;
  owner: Types.ObjectId;
  content: string;
  inTrash: boolean;
  isVisible: boolean;
  shareWith: { user: Types.ObjectId; permissions: PermissionType[] }[];
  comentarios: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

const diasAtras = (dias: number) =>
  new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

async function main() {
  await mongoose.connect(MONGO_URI);

  await Promise.all([
    UsuarioModel.deleteMany({}),
    ArchivoModel.deleteMany({}),
    CarpetaModel.deleteMany({}),
    ActividadModel.deleteMany({}),
  ]);

  const password = await bcryptjs.hash('password123', 12);

  const usuarios = [
    {
      _id: new Types.ObjectId(),
      username: 'admin',
      name: 'Administrador',
      lastname: 'Sistema',
      password,
      role: Role.ADMIN,
      status: true,
      createdAt: diasAtras(90),
      updatedAt: diasAtras(90),
    },
    {
      _id: new Types.ObjectId(),
      username: 'juan',
      name: 'Juan',
      lastname: 'Pérez',
      password,
      role: Role.USER,
      status: true,
      createdAt: diasAtras(80),
      updatedAt: diasAtras(80),
    },
    {
      _id: new Types.ObjectId(),
      username: 'maria',
      name: 'María',
      lastname: 'Gómez',
      password,
      role: Role.USER,
      status: true,
      createdAt: diasAtras(70),
      updatedAt: diasAtras(70),
    },
  ];

  await UsuarioModel.collection.insertMany(usuarios);

  const usuariosOperativos = usuarios.filter((u) => u.role === Role.USER);

  const carpetas: CarpetaSeed[] = [];

  const crearCarpeta = (
    name: string,
    owner: Types.ObjectId,
    padre: CarpetaSeed | null,
    fecha: Date,
  ): CarpetaSeed => {
    const carpeta: CarpetaSeed = {
      _id: new Types.ObjectId(),
      name,
      parentFolder: padre ? padre._id : null,
      ancestors: padre ? [...padre.ancestors, padre._id] : [],
      owner,
      size: 0,
      shareWith: [],
      comentarios: [],
      inTrash: false,
      isVisible: true,
      createdAt: fecha,
      updatedAt: fecha,
    };
    carpetas.push(carpeta);
    return carpeta;
  };

  for (const [indice, usuario] of usuariosOperativos.entries()) {
    const base = crearCarpeta(
      `Documentos de ${usuario.name}`,
      usuario._id,
      null,
      diasAtras(60 + indice),
    );
    const informes = crearCarpeta(
      'Informes',
      usuario._id,
      base,
      diasAtras(55 + indice),
    );
    const contratos = crearCarpeta(
      'Contratos',
      usuario._id,
      base,
      diasAtras(50 + indice),
    );
    const personales = crearCarpeta(
      'Personales',
      usuario._id,
      base,
      diasAtras(45 + indice),
    );
    crearCarpeta('2025', usuario._id, informes, diasAtras(40 + indice));
    crearCarpeta('2026', usuario._id, informes, diasAtras(35 + indice));
    crearCarpeta('Clientes', usuario._id, contratos, diasAtras(30 + indice));
    crearCarpeta('Borradores', usuario._id, personales, diasAtras(25 + indice));
  }

  const archivos: ArchivoSeed[] = [];
  const nombresBase = [
    'informe_trimestral',
    'contrato_servicios',
    'acta_reunion',
    'propuesta_comercial',
    'presupuesto',
    'manual_procesos',
    'politica_privacidad',
    'plan_proyecto',
    'reporte_gastos',
    'nota_interna',
  ];

  for (let i = 0; i < 50; i++) {
    const propietario = usuariosOperativos[i % usuariosOperativos.length];
    const carpetasUsuario = carpetas.filter((c) =>
      c.owner.equals(propietario._id),
    );
    const carpeta = carpetasUsuario[i % carpetasUsuario.length];
    const extension = i % 3 === 0 ? 'md' : 'txt';
    const nombre = `${nombresBase[i % nombresBase.length]}_${String(i + 1).padStart(2, '0')}.${extension}`;
    const contenido =
      extension === 'md'
        ? `# ${nombre}\n\nDocumento de prueba número ${i + 1}.\n\n- Propietario: ${propietario.username}\n- Carpeta: ${carpeta.name}\n\nContenido generado para la carga inicial del sistema.\n`
        : `Documento de prueba número ${i + 1}.\nPropietario: ${propietario.username}\nCarpeta: ${carpeta.name}\n\nContenido generado para la carga inicial del sistema de gestión documental.\n`;
    const fecha = diasAtras(50 - (i % 45));

    archivos.push({
      _id: new Types.ObjectId(),
      name: nombre,
      type: extension,
      parentFolder: carpeta._id,
      ancestors: [...carpeta.ancestors, carpeta._id],
      size: Buffer.byteLength(contenido, 'utf8'),
      owner: propietario._id,
      content: contenido,
      inTrash: false,
      isVisible: true,
      shareWith: [],
      comentarios: [],
      createdAt: fecha,
      updatedAt: fecha,
    });
  }

  let comparticiones = 0;
  const permisosPosibles = [
    [PermissionType.READ],
    [PermissionType.READ, PermissionType.COMMENT],
    [PermissionType.READ, PermissionType.EDIT],
  ];

  for (let i = 0; i < 20; i++) {
    const archivo = archivos[i];
    const propietario = usuariosOperativos.find((u) =>
      u._id.equals(archivo.owner),
    );
    const destinatarios = usuariosOperativos.filter(
      (u) => !u._id.equals(archivo.owner),
    );
    const destinatario = destinatarios[i % destinatarios.length];

    archivo.shareWith.push({
      user: destinatario._id,
      permissions: permisosPosibles[i % permisosPosibles.length],
    });
    comparticiones++;

    if (propietario && i % 4 === 0 && destinatarios.length > 1) {
      const segundo = destinatarios[(i + 1) % destinatarios.length];
      if (!archivo.shareWith.some((p) => p.user.equals(segundo._id))) {
        archivo.shareWith.push({
          user: segundo._id,
          permissions: [PermissionType.READ],
        });
        comparticiones++;
      }
    }
  }

  for (let i = 0; i < 6; i++) {
    const carpeta = carpetas[i];
    const propietario = usuariosOperativos.find((u) =>
      u._id.equals(carpeta.owner),
    );
    const destinatarios = usuariosOperativos.filter(
      (u) => !u._id.equals(carpeta.owner),
    );
    const destinatario = destinatarios[i % destinatarios.length];

    if (propietario) {
      carpeta.shareWith.push({
        user: destinatario._id,
        permissions:
          i % 2 === 0
            ? [PermissionType.READ]
            : [PermissionType.READ, PermissionType.EDIT],
      });
      comparticiones++;
    }
  }

  const archivosBasura = [47, 48, 49];
  for (const indice of archivosBasura) {
    archivos[indice].inTrash = true;
    archivos[indice].isVisible = false;
    archivos[indice].updatedAt = diasAtras(2);
  }

  const carpetaPapelera = carpetas.find((c) => c.name === 'Borradores');
  if (carpetaPapelera) {
    carpetaPapelera.inTrash = true;
    carpetaPapelera.isVisible = false;
    carpetaPapelera.updatedAt = diasAtras(3);

    for (const hija of carpetas.filter((c) =>
      c.ancestors.some((a) => a.equals(carpetaPapelera._id)),
    )) {
      hija.isVisible = false;
    }
    for (const archivo of archivos.filter((a) =>
      a.ancestors.some((a2) => a2.equals(carpetaPapelera._id)),
    )) {
      archivo.isVisible = false;
    }
  }

  for (let i = 0; i < 8; i++) {
    const archivo = archivos[i];
    const autor = usuariosOperativos[(i + 1) % usuariosOperativos.length];
    archivo.comentarios.push({
      _id: new Types.ObjectId(),
      user: autor._id,
      texto: `Comentario de revisión número ${i + 1}`,
      isReported: false,
      createdAt: diasAtras(10 - (i % 8)),
      updatedAt: diasAtras(10 - (i % 8)),
    });
  }

  for (const carpeta of carpetas) {
    const contenido = archivos.filter(
      (a) => !a.inTrash && a.ancestors.some((id) => id.equals(carpeta._id)),
    );
    carpeta.size = contenido.reduce((total, a) => total + a.size, 0);
  }

  await CarpetaModel.collection.insertMany(carpetas);
  await ArchivoModel.collection.insertMany(archivos);

  const actividades: Record<string, unknown>[] = [];

  const agregarActividad = (
    user: Types.ObjectId,
    action: Accion,
    resourceType: TipoRecurso,
    resourceId: Types.ObjectId | null,
    resourceName: string,
    fecha: Date,
    details: Record<string, unknown> = {},
  ) => {
    actividades.push({
      _id: new Types.ObjectId(),
      user,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      createdAt: fecha,
      updatedAt: fecha,
    });
  };

  for (const usuario of usuarios) {
    agregarActividad(
      usuario._id,
      Accion.USUARIO_CREADO,
      TipoRecurso.USUARIO,
      usuario._id,
      usuario.username,
      usuario.createdAt,
      { role: usuario.role },
    );
  }

  for (const carpeta of carpetas) {
    agregarActividad(
      carpeta.owner,
      Accion.CARPETA_CREADA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
      carpeta.createdAt,
      { parentFolder: carpeta.parentFolder },
    );
  }

  for (const archivo of archivos) {
    agregarActividad(
      archivo.owner,
      Accion.ARCHIVO_CREADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      archivo.createdAt,
      { type: archivo.type, size: archivo.size },
    );
  }

  for (const archivo of archivos) {
    for (const permiso of archivo.shareWith) {
      agregarActividad(
        archivo.owner,
        Accion.RECURSO_COMPARTIDO,
        TipoRecurso.PERMISO,
        archivo._id,
        archivo.name,
        diasAtras(15 - (archivo.size % 10)),
        {
          usuario: permiso.user,
          permisos: permiso.permissions,
          tipoRecurso: TipoRecurso.ARCHIVO,
        },
      );
    }
  }

  for (const archivo of archivos.slice(0, 12)) {
    agregarActividad(
      archivo.owner,
      Accion.ARCHIVO_DESCARGADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      diasAtras(12 - (archivo.size % 10)),
    );
  }

  for (const archivo of archivos.slice(10, 18)) {
    agregarActividad(
      archivo.owner,
      Accion.ARCHIVO_ACTUALIZADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      diasAtras(9 - (archivo.size % 8)),
      { campos: ['content'] },
    );
  }

  for (const indice of archivosBasura) {
    const archivo = archivos[indice];
    agregarActividad(
      archivo.owner,
      Accion.ARCHIVO_ENVIADO_PAPELERA,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      diasAtras(2),
    );
  }

  if (carpetaPapelera) {
    agregarActividad(
      carpetaPapelera.owner,
      Accion.CARPETA_ENVIADA_PAPELERA,
      TipoRecurso.CARPETA,
      carpetaPapelera._id,
      carpetaPapelera.name,
      diasAtras(3),
    );
  }

  await ActividadModel.collection.insertMany(actividades);

  const resumen = {
    usuarios: usuarios.length,
    carpetas: carpetas.length,
    archivos: archivos.length,
    comparticiones,
    archivosEnPapelera: archivosBasura.length,
    actividades: actividades.length,
    credenciales: 'admin / juan / maria — contraseña: password123',
  };

  console.log('Carga inicial completada:', JSON.stringify(resumen, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Error en la carga inicial:', error);
  await mongoose.disconnect();
  process.exit(1);
});
