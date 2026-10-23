import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Carpeta } from 'src/schemas/Carpeta.schema';
import { Usuario } from 'src/schemas/Usuario.schema';
import { Actividad, TipoRecurso } from 'src/schemas/Actividad.schema';

@Injectable()
export class ReportesService {
  constructor(
    @InjectModel(Archivo.name) private readonly archivoModel: Model<Archivo>,
    @InjectModel(Carpeta.name) private readonly carpetaModel: Model<Carpeta>,
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    @InjectModel(Actividad.name)
    private readonly actividadModel: Model<Actividad>,
  ) {}

  private idDe(valor: unknown): string {
    if (!valor) return '';
    if (valor instanceof Types.ObjectId) return valor.toString();
    if (typeof valor === 'string') return valor;
    const posible = valor as { _id?: Types.ObjectId };
    return posible._id ? posible._id.toString() : '';
  }

  private fecha(valor: string | undefined, campo: string) {
    if (!valor) return undefined;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime()))
      throw new BadRequestException(`Fecha inválida: ${campo}`);
    return fecha;
  }

  private rango(desde?: string, hasta?: string) {
    const rango: { $gte?: Date; $lte?: Date } = {};
    const inicio = this.fecha(desde, 'desde');
    const fin = this.fecha(hasta, 'hasta');
    if (inicio) {
      if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) {
        inicio.setHours(0, 0, 0, 0);
      }
      rango.$gte = inicio;
    }
    if (fin) {
      if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
        fin.setHours(23, 59, 59, 999);
      }
      rango.$lte = fin;
    }
    return Object.keys(rango).length ? rango : undefined;
  }

  usuarios() {
    return this.usuarioModel
      .find()
      .select('username name lastname status role')
      .sort({ username: 1 });
  }

  archivosPorTipo() {
    return this.archivoModel.aggregate([
      { $match: { inTrash: false } },
      {
        $group: {
          _id: '$type',
          cantidad: { $sum: 1 },
          tamanioTotal: { $sum: '$size' },
        },
      },
      { $project: { _id: 0, tipo: '$_id', cantidad: 1, tamanioTotal: 1 } },
      { $sort: { cantidad: -1 } },
    ]);
  }

  async archivosPorRango(desde?: string, hasta?: string) {
    const rango = this.rango(desde, hasta);
    if (!rango)
      throw new BadRequestException(
        'Debe indicar al menos una fecha (desde o hasta)',
      );

    const query: QueryFilter<Archivo> = { inTrash: false, createdAt: rango };
    const [items, total] = await Promise.all([
      this.archivoModel
        .find(query)
        .select('-content')
        .populate('owner', 'username name lastname')
        .sort({ createdAt: -1 })
        .limit(500),
      this.archivoModel.countDocuments(query),
    ]);

    return { items, total, desde: desde ?? null, hasta: hasta ?? null };
  }

  async comentariosReportados() {
    const [archivos, carpetas] = await Promise.all([
      this.archivoModel
        .find({ 'comentarios.isReported': true })
        .select('name type owner comentarios createdAt')
        .populate('owner', 'username name lastname')
        .populate('comentarios.user', 'username name lastname')
        .populate('comentarios.reportedBy', 'username name lastname')
        .lean(),
      this.carpetaModel
        .find({ 'comentarios.isReported': true })
        .select('name owner comentarios createdAt')
        .populate('owner', 'username name lastname')
        .populate('comentarios.user', 'username name lastname')
        .populate('comentarios.reportedBy', 'username name lastname')
        .lean(),
    ]);

    const reportes = [
      ...archivos.map((archivo) => ({
        recursoId: archivo._id,
        recursoNombre: archivo.name,
        tipoRecurso: TipoRecurso.ARCHIVO,
        tipo: archivo.type,
        propietario: archivo.owner,
        comentarios: archivo.comentarios ?? [],
      })),
      ...carpetas.map((carpeta) => ({
        recursoId: carpeta._id,
        recursoNombre: carpeta.name,
        tipoRecurso: TipoRecurso.CARPETA,
        tipo: null,
        propietario: carpeta.owner,
        comentarios: carpeta.comentarios ?? [],
      })),
    ];

    return reportes
      .flatMap((recurso) =>
        (recurso.comentarios as unknown[])
          .map((comentario) => comentario as Record<string, unknown>)
          .filter((comentario) => comentario['isReported'] === true)
          .map((comentario) => ({
            comentarioId: comentario['_id'],
            texto: comentario['texto'],
            autor: comentario['user'],
            reportadoPor: comentario['reportedBy'] ?? null,
            reportadoEn:
              comentario['reportedAt'] ?? comentario['updatedAt'] ?? null,
            creadoEn: comentario['createdAt'] ?? null,
            recursoId: recurso.recursoId,
            recursoNombre: recurso.recursoNombre,
            tipoRecurso: recurso.tipoRecurso,
            tipo: recurso.tipo,
            propietario: recurso.propietario,
          })),
      )
      .sort((a, b) => {
        const fechaA = a.reportadoEn
          ? new Date(a.reportadoEn as string | Date).getTime()
          : 0;
        const fechaB = b.reportadoEn
          ? new Date(b.reportadoEn as string | Date).getTime()
          : 0;
        return fechaB - fechaA;
      });
  }

  archivosMasOperaciones(limit = 10) {
    return this.actividadModel.aggregate([
      { $match: { resourceType: TipoRecurso.ARCHIVO } },
      { $group: { _id: '$resourceId', operaciones: { $sum: 1 } } },
      { $sort: { operaciones: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: this.archivoModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'archivo',
        },
      },
      { $unwind: { path: '$archivo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: this.usuarioModel.collection.name,
          localField: 'archivo.owner',
          foreignField: '_id',
          as: 'propietario',
        },
      },
      {
        $unwind: {
          path: '$propietario',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          archivoId: '$_id',
          nombre: '$archivo.name',
          tipo: '$archivo.type',
          propietario: '$propietario.username',
          operaciones: 1,
        },
      },
    ]);
  }

  async topUsuariosArchivos(limit = 10) {
    return this.archivoModel.aggregate([
      { $match: { inTrash: false } },
      {
        $group: {
          _id: '$owner',
          archivos: { $sum: 1 },
          tamanioTotal: { $sum: '$size' },
        },
      },
      { $sort: { archivos: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: this.usuarioModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          username: '$usuario.username',
          nombre: { $concat: ['$usuario.name', ' ', '$usuario.lastname'] },
          archivos: 1,
          tamanioTotal: 1,
        },
      },
    ]);
  }

  async usuariosMasCompartidos(limit = 10) {
    type Agrupado = {
      _id: Types.ObjectId;
      recursos: number;
      comparticiones: number;
    };

    const [archivos, carpetas] = await Promise.all([
      this.archivoModel.aggregate<Agrupado>([
        { $match: { 'shareWith.0': { $exists: true } } },
        {
          $group: {
            _id: '$owner',
            recursos: { $sum: 1 },
            comparticiones: { $sum: { $size: '$shareWith' } },
          },
        },
      ]),
      this.carpetaModel.aggregate<Agrupado>([
        { $match: { 'shareWith.0': { $exists: true } } },
        {
          $group: {
            _id: '$owner',
            recursos: { $sum: 1 },
            comparticiones: { $sum: { $size: '$shareWith' } },
          },
        },
      ]),
    ]);

    const acumulado = new Map<
      string,
      { usuarioId: Types.ObjectId; recursos: number; comparticiones: number }
    >();

    for (const item of [...archivos, ...carpetas]) {
      const id = item._id.toString();
      const actual = acumulado.get(id) ?? {
        usuarioId: item._id,
        recursos: 0,
        comparticiones: 0,
      };
      actual.recursos += item.recursos;
      actual.comparticiones += item.comparticiones;
      acumulado.set(id, actual);
    }

    const usuarios = await this.usuarioModel
      .find({ _id: { $in: [...acumulado.values()].map((u) => u.usuarioId) } })
      .select('username name lastname');

    const usuariosPorId = new Map(usuarios.map((u) => [u._id.toString(), u]));

    return [...acumulado.entries()]
      .map(([id, item]) => {
        const usuario = usuariosPorId.get(id);
        return {
          usuarioId: item.usuarioId,
          username: usuario?.username ?? '',
          nombre: usuario ? `${usuario.name} ${usuario.lastname}` : '',
          recursos: item.recursos,
          comparticiones: item.comparticiones,
        };
      })
      .sort(
        (a, b) =>
          b.comparticiones - a.comparticiones || b.recursos - a.recursos,
      )
      .slice(0, limit);
  }

  archivosMasCompartidos(limit = 10) {
    return this.archivoModel.aggregate([
      { $match: { 'shareWith.0': { $exists: true }, inTrash: false } },
      { $addFields: { cantidadUsuarios: { $size: '$shareWith' } } },
      { $sort: { cantidadUsuarios: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: this.usuarioModel.collection.name,
          localField: 'owner',
          foreignField: '_id',
          as: 'propietario',
        },
      },
      { $unwind: { path: '$propietario', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          archivoId: '$_id',
          nombre: '$name',
          tipo: '$type',
          cantidadUsuarios: 1,
          propietario: '$propietario.username',
        },
      },
    ]);
  }

  async recursosCompartidosPorUsuario(userId: string) {
    const usuarioId = new Types.ObjectId(userId);

    const [archivos, carpetas] = await Promise.all([
      this.archivoModel
        .find({ owner: usuarioId, 'shareWith.0': { $exists: true } })
        .select('name type shareWith createdAt')
        .lean(),
      this.carpetaModel
        .find({ owner: usuarioId, 'shareWith.0': { $exists: true } })
        .select('name shareWith createdAt')
        .lean(),
    ]);

    return [
      ...archivos.map((a) => ({
        recursoId: a._id,
        tipo: TipoRecurso.ARCHIVO,
        nombre: a.name,
        compartidoCon: a.shareWith?.length ?? 0,
        creado: a.createdAt,
      })),
      ...carpetas.map((c) => ({
        recursoId: c._id,
        tipo: TipoRecurso.CARPETA,
        nombre: c.name,
        compartidoCon: c.shareWith?.length ?? 0,
        creado: c.createdAt,
      })),
    ].sort((a, b) => b.compartidoCon - a.compartidoCon);
  }

  async recursosRecibidosPorUsuario(userId: string) {
    const usuarioId = new Types.ObjectId(userId);

    const [archivos, carpetas] = await Promise.all([
      this.archivoModel
        .find({ 'shareWith.user': usuarioId, inTrash: false })
        .select('name type owner shareWith createdAt')
        .populate('owner', 'username name lastname')
        .lean(),
      this.carpetaModel
        .find({ 'shareWith.user': usuarioId, inTrash: false })
        .select('name owner shareWith createdAt')
        .populate('owner', 'username name lastname')
        .lean(),
    ]);

    return [
      ...archivos.map((a) => ({
        recursoId: a._id,
        tipo: TipoRecurso.ARCHIVO,
        nombre: a.name,
        propietario: a.owner,
        permisos:
          a.shareWith?.find((p) => this.idDe(p.user) === userId)?.permissions ??
          [],
        creado: a.createdAt,
      })),
      ...carpetas.map((c) => ({
        recursoId: c._id,
        tipo: TipoRecurso.CARPETA,
        nombre: c.name,
        propietario: c.owner,
        permisos:
          c.shareWith?.find((p) => this.idDe(p.user) === userId)?.permissions ??
          [],
        creado: c.createdAt,
      })),
    ];
  }

  async actividadUsuario(id: string, desde?: string, hasta?: string) {
    const rango = this.rango(desde, hasta);
    const query: QueryFilter<Actividad> = { user: new Types.ObjectId(id) };
    if (rango) query.createdAt = rango;

    return this.actividadModel
      .find(query)
      .populate('user', 'username name lastname')
      .sort({ createdAt: -1 })
      .limit(1000);
  }

  actividadPorTipo() {
    return this.actividadModel.aggregate([
      { $group: { _id: '$action', cantidad: { $sum: 1 } } },
      { $project: { _id: 0, accion: '$_id', cantidad: 1 } },
      { $sort: { cantidad: -1 } },
    ]);
  }

  actividadPorPeriodo(unidad = 'mes', desde?: string, hasta?: string) {
    const formatos: Record<string, string> = {
      dia: '%Y-%m-%d',
      mes: '%Y-%m',
      anio: '%Y',
      day: '%Y-%m-%d',
      month: '%Y-%m',
      year: '%Y',
    };

    const formato = formatos[unidad];
    if (!formato)
      throw new BadRequestException('Unidad inválida. Use dia, mes o anio');

    const rango = this.rango(desde, hasta);
    const pipeline: PipelineStage[] = [];
    if (rango) pipeline.push({ $match: { createdAt: rango } });
    pipeline.push(
      {
        $group: {
          _id: { $dateToString: { format: formato, date: '$createdAt' } },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { _id: 0, periodo: '$_id', cantidad: 1 } },
      { $sort: { periodo: 1 } },
    );

    return this.actividadModel.aggregate(pipeline);
  }

  principalesAcciones(limit = 10) {
    return this.actividadModel.aggregate([
      { $group: { _id: '$action', cantidad: { $sum: 1 } } },
      { $project: { _id: 0, accion: '$_id', cantidad: 1 } },
      { $sort: { cantidad: -1 } },
      { $limit: limit },
    ]);
  }
}
