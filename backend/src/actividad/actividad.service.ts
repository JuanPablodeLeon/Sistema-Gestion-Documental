import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Actividad, Accion, TipoRecurso } from 'src/schemas/Actividad.schema';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Carpeta } from 'src/schemas/Carpeta.schema';
import { Role } from 'src/common/enums/rol.enum';

export interface FiltroActividad {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  desde?: string;
  hasta?: string;
  page?: string | number;
  limit?: string | number;
}

const ACCIONES_NOTIFICABLES: Accion[] = [
  Accion.ARCHIVO_ACTUALIZADO,
  Accion.ARCHIVO_RENOMBRADO,
  Accion.ARCHIVO_MOVIDO,
  Accion.ARCHIVO_ENVIADO_PAPELERA,
  Accion.ARCHIVO_RESTAURADO,
  Accion.ARCHIVO_ELIMINADO,
  Accion.CARPETA_RENOMBRADA,
  Accion.CARPETA_MOVIDA,
  Accion.CARPETA_ENVIADA_PAPELERA,
  Accion.CARPETA_RESTAURADA,
  Accion.CARPETA_ELIMINADA,
  Accion.RECURSO_COMPARTIDO,
  Accion.PERMISO_MODIFICADO,
  Accion.PERMISO_REVOCADO,
];

@Injectable()
export class ActividadService {
  constructor(
    @InjectModel(Actividad.name)
    private readonly actividadModel: Model<Actividad>,
    @InjectModel(Archivo.name)
    private readonly archivoModel: Model<Archivo>,
    @InjectModel(Carpeta.name)
    private readonly carpetaModel: Model<Carpeta>,
  ) {}

  async registrar(
    userId: string,
    action: Accion,
    resourceType: TipoRecurso,
    resourceId?: Types.ObjectId | string | null,
    resourceName = '',
    details: Record<string, unknown> = {},
  ) {
    return this.actividadModel.create({
      user: new Types.ObjectId(userId),
      action,
      resourceType,
      resourceId: resourceId ? new Types.ObjectId(resourceId.toString()) : null,
      resourceName,
      details,
    });
  }

  async findAll(filtro: FiltroActividad = {}) {
    const query: QueryFilter<Actividad> = {};

    if (filtro.userId) query.user = new Types.ObjectId(filtro.userId);
    if (filtro.action) query.action = filtro.action as Accion;
    if (filtro.resourceType)
      query.resourceType = filtro.resourceType as TipoRecurso;
    if (filtro.resourceId)
      query.resourceId = new Types.ObjectId(filtro.resourceId);

    if (filtro.desde || filtro.hasta) {
      query.createdAt = {};
      if (filtro.desde) query.createdAt.$gte = new Date(filtro.desde);
      if (filtro.hasta) query.createdAt.$lte = new Date(filtro.hasta);
    }

    const page = Math.max(1, Number(filtro.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filtro.limit) || 50));

    const [items, total] = await Promise.all([
      this.actividadModel
        .find(query)
        .populate('user', 'username name lastname')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.actividadModel.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }

  async findNotificaciones(
    userId: string,
    filtro: FiltroActividad = {},
    role?: string,
  ) {
    const uid = new Types.ObjectId(userId);
    const esAdmin = role === Role.ADMIN;

    const [carpetas, archivos] = await Promise.all([
      this.carpetaModel.find({ owner: uid }).select('_id').lean(),
      this.archivoModel.find({ owner: uid }).select('_id').lean(),
    ]);

    const ids = [...carpetas, ...archivos].map((item) => item._id);
    const page = Math.max(1, Number(filtro.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filtro.limit) || 20));

    if (!ids.length && !esAdmin) return { items: [], total: 0, page, limit };

    const eventosRecursos: QueryFilter<Actividad>[] = [
      {
        resourceId: { $in: ids },
        action: { $in: ACCIONES_NOTIFICABLES },
      },
      {
        action: Accion.COMENTARIO_CREADO,
        'details.recurso': { $in: ids },
      },
    ];

    const condiciones: QueryFilter<Actividad>[] = [
      { user: { $ne: uid } },
      {
        $or: esAdmin
          ? [...eventosRecursos, { action: Accion.COMENTARIO_REPORTADO }]
          : eventosRecursos,
      },
    ];

    if (filtro.desde || filtro.hasta) {
      const rango: Record<string, Date> = {};
      if (filtro.desde) rango.$gte = new Date(filtro.desde);
      if (filtro.hasta) rango.$lte = new Date(filtro.hasta);
      condiciones.push({ createdAt: rango });
    }

    const query: QueryFilter<Actividad> = { $and: condiciones };

    const [items, total] = await Promise.all([
      this.actividadModel
        .find(query)
        .populate('user', 'username name lastname')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.actividadModel.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }
}
