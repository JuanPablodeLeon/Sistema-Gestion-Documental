import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Carpeta } from 'src/schemas/Carpeta.schema';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Usuario } from 'src/schemas/Usuario.schema';
import { ActividadService } from 'src/actividad/actividad.service';
import { Accion, TipoRecurso } from 'src/schemas/Actividad.schema';
import { PermisosService } from 'src/common/seguridad/permisos.service';
import {
  PermissionType,
  permisosDeNivel,
} from 'src/schemas/PermisosDoc.schema';
import { CreateCarpetaDto } from './dto/create-carpeta.dto';
import { UpdateCarpetaDto } from './dto/update-carpeta.dto';
import { MoverCarpetaDto } from './dto/mover-carpeta.dto';
import { CompartirDto, CompartirLoteDto } from 'src/common/dto/compartir.dto';

type FiltroCarpeta = {
  parentFolder?: string;
  q?: string;
  trash?: string;
  page?: string;
  limit?: string;
};

@Injectable()
export class CarpetaService {
  constructor(
    @InjectModel(Carpeta.name) private readonly carpetaModel: Model<Carpeta>,
    @InjectModel(Archivo.name) private readonly archivoModel: Model<Archivo>,
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    private readonly permisosService: PermisosService,
    private readonly actividadService: ActividadService,
  ) {}

  private idDe(valor: unknown): string {
    if (!valor) return '';
    if (valor instanceof Types.ObjectId) return valor.toString();
    if (typeof valor === 'string') return valor;
    const posible = valor as { _id?: Types.ObjectId };
    return posible._id ? posible._id.toString() : '';
  }

  private async obtenerCarpeta(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Identificador de carpeta inválido');
    const carpeta = await this.carpetaModel.findById(id);
    if (!carpeta) throw new NotFoundException('Carpeta no encontrada');
    return carpeta;
  }

  private async obtenerPadre(
    parentFolderId: string | undefined,
    userId: string,
    excluirId?: string,
  ) {
    if (!parentFolderId) return null;

    if (!Types.ObjectId.isValid(parentFolderId)) {
      throw new BadRequestException('Identificador de carpeta padre inválido');
    }
    if (excluirId && parentFolderId === excluirId) {
      throw new BadRequestException('Una carpeta no puede ser su propio padre');
    }

    const padre = await this.carpetaModel.findById(parentFolderId);
    if (!padre) throw new NotFoundException('Carpeta padre no encontrada');
    if (padre.inTrash || !padre.isVisible) {
      throw new BadRequestException(
        'La carpeta padre se encuentra en la papelera',
      );
    }

    await this.permisosService.assertCarpeta(
      userId,
      parentFolderId,
      PermissionType.EDIT,
    );
    return padre;
  }

  private validarPropietario(carpeta: Carpeta, userId: string) {
    if (!this.permisosService.esPropietario(carpeta, userId)) {
      throw new ForbiddenException(
        'Solo el propietario puede realizar esta operación',
      );
    }
  }

  private async validarUsuarioDestino(userId: string, propietarioId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('Usuario destino inválido');
    if (userId === propietarioId)
      throw new BadRequestException(
        'No puede compartir un recurso consigo mismo',
      );

    const usuario = await this.usuarioModel.findById(userId);
    if (!usuario) throw new NotFoundException('Usuario destino no encontrado');
    if (!usuario.status)
      throw new BadRequestException('El usuario destino se encuentra inactivo');
    return usuario;
  }

  async create(createCarpetaDto: CreateCarpetaDto, userId: string) {
    const padre = await this.obtenerPadre(
      createCarpetaDto.parentFolder,
      userId,
    );

    const carpeta = await this.carpetaModel.create({
      name: createCarpetaDto.name.trim(),
      parentFolder: padre ? padre._id : null,
      ancestors: padre ? [...padre.ancestors, padre._id] : [],
      owner: new Types.ObjectId(userId),
      size: 0,
      shareWith: [],
      comentarios: [],
      inTrash: false,
      isVisible: true,
    });

    await this.actividadService.registrar(
      userId,
      Accion.CARPETA_CREADA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
      { parentFolder: padre ? padre._id : null },
    );

    await this.recalcularTamanio(padre ? [...padre.ancestors, padre._id] : []);

    return carpeta;
  }

  async findAll(userId: string, filtro: FiltroCarpeta = {}) {
    const query: QueryFilter<Carpeta> = {};

    if (filtro.trash === 'true') {
      query.owner = new Types.ObjectId(userId);
      query.inTrash = true;
    } else {
      const accesibles =
        await this.permisosService.getAccessibleFolderIds(userId);
      query.$or = [
        { owner: new Types.ObjectId(userId) },
        { 'shareWith.user': new Types.ObjectId(userId) },
        { _id: { $in: accesibles } },
      ];
      query.inTrash = false;
      query.isVisible = true;
    }

    if (filtro.parentFolder !== undefined) {
      if (filtro.parentFolder === '' || filtro.parentFolder === 'null') {
        query.parentFolder = null;
      } else if (Types.ObjectId.isValid(filtro.parentFolder)) {
        query.parentFolder = new Types.ObjectId(filtro.parentFolder);
      } else {
        throw new BadRequestException(
          'Identificador de carpeta padre inválido',
        );
      }
    }

    if (filtro.q) {
      query.name = {
        $regex: filtro.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }

    const page = Math.max(1, Number(filtro.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filtro.limit) || 100));

    const [items, total] = await Promise.all([
      this.carpetaModel
        .find(query)
        .populate('owner', 'username name lastname')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.carpetaModel.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const carpeta = await this.permisosService.assertCarpeta(
      userId,
      id,
      PermissionType.READ,
    );

    if (
      (carpeta.inTrash || !carpeta.isVisible) &&
      !this.permisosService.esPropietario(carpeta, userId)
    ) {
      throw new ForbiddenException('La carpeta no se encuentra disponible');
    }

    const [subcarpetas, archivos, permiso, ancestros] = await Promise.all([
      this.carpetaModel
        .find({ parentFolder: carpeta._id, inTrash: false, isVisible: true })
        .populate('owner', 'username name lastname')
        .sort({ name: 1 }),
      this.archivoModel
        .find({ parentFolder: carpeta._id, inTrash: false, isVisible: true })
        .select('-content')
        .populate('owner', 'username name lastname')
        .sort({ name: 1 }),
      this.permisosService.permisoCarpeta(userId, carpeta),
      this.carpetaModel
        .find({ _id: { $in: carpeta.ancestors } })
        .select('name')
        .lean(),
    ]);

    const porId = new Map(
      ancestros.map((ancestro) => [ancestro._id.toString(), ancestro]),
    );
    const ruta = carpeta.ancestors.flatMap((ancestro) => {
      const encontrado = porId.get(this.idDe(ancestro));
      return encontrado
        ? [{ _id: encontrado._id.toString(), name: encontrado.name }]
        : [];
    });

    return { carpeta, subcarpetas, archivos, ruta, permiso };
  }

  contenido(id: string, userId: string) {
    return this.findOne(id, userId);
  }

  async findPapelera(userId: string) {
    return this.carpetaModel
      .find({ owner: new Types.ObjectId(userId), inTrash: true })
      .populate('owner', 'username name lastname')
      .sort({ updatedAt: -1 });
  }

  async update(id: string, updateCarpetaDto: UpdateCarpetaDto, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    if (updateCarpetaDto.name !== undefined) {
      carpeta.name = updateCarpetaDto.name.trim();
    }

    if (updateCarpetaDto.parentFolder !== undefined) {
      const movida = await this.mover(
        id,
        { parentFolder: updateCarpetaDto.parentFolder },
        userId,
      );

      if (updateCarpetaDto.name !== undefined) {
        movida.name = updateCarpetaDto.name.trim();
        await movida.save();
        await this.actividadService.registrar(
          userId,
          Accion.CARPETA_RENOMBRADA,
          TipoRecurso.CARPETA,
          movida._id,
          movida.name,
        );
      }

      return movida;
    }

    await carpeta.save();
    await this.actividadService.registrar(
      userId,
      Accion.CARPETA_RENOMBRADA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
    );

    return carpeta;
  }

  async mover(id: string, moverCarpetaDto: MoverCarpetaDto, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    if (carpeta.inTrash)
      throw new BadRequestException(
        'No se puede mover una carpeta de la papelera',
      );

    const padre = await this.obtenerPadre(
      moverCarpetaDto.parentFolder,
      userId,
      id,
    );

    if (padre && padre.ancestors.some((a) => this.idDe(a) === id)) {
      throw new BadRequestException(
        'No se puede mover una carpeta dentro de una de sus subcarpetas',
      );
    }

    const ancestrosAnteriores = carpeta.ancestors.map((a) => this.idDe(a));
    const nuevosAncestros = padre ? [...padre.ancestors, padre._id] : [];

    if (this.idDe(padre?._id) === this.idDe(carpeta.parentFolder)) {
      return carpeta;
    }

    const descendientesCarpetas = await this.carpetaModel.find({
      ancestors: carpeta._id,
    });
    for (const descendiente of descendientesCarpetas) {
      const indice = descendiente.ancestors.findIndex(
        (a) => this.idDe(a) === id,
      );
      const resto = descendiente.ancestors.slice(indice);
      descendiente.ancestors = [...nuevosAncestros, ...resto];
      await descendiente.save();
    }

    const archivos = await this.archivoModel.find({ ancestors: carpeta._id });
    for (const archivo of archivos) {
      const indice = archivo.ancestors.findIndex((a) => this.idDe(a) === id);
      const resto = archivo.ancestors.slice(indice);
      archivo.ancestors = [...nuevosAncestros, ...resto];
      await archivo.save();
    }

    carpeta.parentFolder = padre ? padre._id : null;
    carpeta.ancestors = nuevosAncestros;
    await carpeta.save();

    await this.recalcularVisibilidad(carpeta);

    const afectadas = [
      ...ancestrosAnteriores,
      ...nuevosAncestros.map((a) => this.idDe(a)),
      id,
    ];
    await this.recalcularTamanio(afectadas);

    await this.actividadService.registrar(
      userId,
      Accion.CARPETA_MOVIDA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
      {
        anterior: carpeta.parentFolder ? this.idDe(carpeta.parentFolder) : null,
        nuevo: padre ? padre._id : null,
      },
    );

    return carpeta;
  }

  async remove(id: string, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    if (carpeta.inTrash)
      throw new BadRequestException(
        'La carpeta ya se encuentra en la papelera',
      );

    carpeta.inTrash = true;
    carpeta.isVisible = false;
    await carpeta.save();
    await this.recalcularVisibilidad(carpeta);
    await this.recalcularTamanio([...carpeta.ancestors, carpeta._id]);

    await this.actividadService.registrar(
      userId,
      Accion.CARPETA_ENVIADA_PAPELERA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
    );

    return { message: 'Carpeta enviada a la papelera', id: carpeta._id };
  }

  async restaurar(id: string, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    if (!carpeta.inTrash)
      throw new BadRequestException(
        'La carpeta no se encuentra en la papelera',
      );

    if (carpeta.parentFolder) {
      const padre = await this.carpetaModel.findById(carpeta.parentFolder);
      if (!padre) throw new NotFoundException('La carpeta padre ya no existe');
      if (padre.inTrash || !padre.isVisible) {
        throw new BadRequestException(
          'Debe restaurar primero la carpeta padre',
        );
      }
    }

    carpeta.inTrash = false;
    carpeta.isVisible = true;
    await carpeta.save();
    await this.recalcularVisibilidad(carpeta);
    await this.recalcularTamanio([...carpeta.ancestors, carpeta._id]);

    await this.actividadService.registrar(
      userId,
      Accion.CARPETA_RESTAURADA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
    );

    return { message: 'Carpeta restaurada', id: carpeta._id };
  }

  async eliminarDefinitivo(id: string, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    if (!carpeta.inTrash) {
      throw new BadRequestException(
        'La carpeta debe estar en la papelera para eliminarse definitivamente',
      );
    }

    const descendientes = await this.carpetaModel
      .find({ ancestors: carpeta._id })
      .select('_id');
    const idsCarpetas = [carpeta._id, ...descendientes.map((c) => c._id)];

    await this.archivoModel.deleteMany({
      $or: [
        { ancestors: { $in: idsCarpetas } },
        { parentFolder: { $in: idsCarpetas } },
      ],
    });
    await this.carpetaModel.deleteMany({ _id: { $in: idsCarpetas } });

    await this.recalcularTamanio(carpeta.ancestors.map((a) => this.idDe(a)));

    await this.actividadService.registrar(
      userId,
      Accion.CARPETA_ELIMINADA,
      TipoRecurso.CARPETA,
      carpeta._id,
      carpeta.name,
      { carpetasEliminadas: idsCarpetas.length },
    );

    return { message: 'Carpeta eliminada definitivamente', id: carpeta._id };
  }

  async compartir(id: string, dto: CompartirDto, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);
    if (carpeta.inTrash)
      throw new BadRequestException(
        'No se puede compartir una carpeta de la papelera',
      );
    await this.validarUsuarioDestino(dto.userId, userId);

    if (!carpeta.shareWith) carpeta.shareWith = [];
    const existente = carpeta.shareWith.find(
      (p) => this.idDe(p.user) === dto.userId,
    );

    if (existente) {
      existente.permissions = dto.permissions;
      await carpeta.save();
      await this.actividadService.registrar(
        userId,
        Accion.PERMISO_MODIFICADO,
        TipoRecurso.PERMISO,
        carpeta._id,
        carpeta.name,
        {
          usuario: dto.userId,
          permisos: dto.permissions,
          tipoRecurso: TipoRecurso.CARPETA,
        },
      );
    } else {
      carpeta.shareWith.push({
        user: new Types.ObjectId(dto.userId),
        permissions: dto.permissions,
      });
      await carpeta.save();
      await this.actividadService.registrar(
        userId,
        Accion.RECURSO_COMPARTIDO,
        TipoRecurso.PERMISO,
        carpeta._id,
        carpeta.name,
        {
          usuario: dto.userId,
          permisos: dto.permissions,
          tipoRecurso: TipoRecurso.CARPETA,
        },
      );
    }

    return this.listarComparticiones(id, userId);
  }

  async compartirVarios(id: string, dto: CompartirLoteDto, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);
    if (carpeta.inTrash)
      throw new BadRequestException(
        'No se puede compartir una carpeta de la papelera',
      );

    const ids = new Set<string>();
    const destinatarios: {
      userId: string;
      permissions: PermissionType[];
    }[] = [];

    for (const item of dto.usuarios) {
      if (ids.has(item.userId))
        throw new BadRequestException(
          'No se puede repetir un usuario en la misma compartición',
        );
      ids.add(item.userId);
      await this.validarUsuarioDestino(item.userId, userId);
      destinatarios.push({
        userId: item.userId,
        permissions: permisosDeNivel(item.nivel),
      });
    }

    if (!carpeta.shareWith) carpeta.shareWith = [];

    const cambios: {
      userId: string;
      permissions: PermissionType[];
      nuevo: boolean;
    }[] = [];

    for (const destinatario of destinatarios) {
      const existente = carpeta.shareWith.find(
        (p) => this.idDe(p.user) === destinatario.userId,
      );

      if (existente) {
        existente.permissions = destinatario.permissions;
        cambios.push({ ...destinatario, nuevo: false });
      } else {
        carpeta.shareWith.push({
          user: new Types.ObjectId(destinatario.userId),
          permissions: destinatario.permissions,
        });
        cambios.push({ ...destinatario, nuevo: true });
      }
    }

    await carpeta.save();

    for (const cambio of cambios) {
      await this.actividadService.registrar(
        userId,
        cambio.nuevo ? Accion.RECURSO_COMPARTIDO : Accion.PERMISO_MODIFICADO,
        TipoRecurso.PERMISO,
        carpeta._id,
        carpeta.name,
        {
          usuario: cambio.userId,
          permisos: cambio.permissions,
          tipoRecurso: TipoRecurso.CARPETA,
        },
      );
    }

    return this.listarComparticiones(id, userId);
  }

  async actualizarPermiso(
    id: string,
    usuarioId: string,
    dto: CompartirDto,
    userId: string,
  ) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    const permiso = carpeta.shareWith?.find(
      (p) => this.idDe(p.user) === usuarioId,
    );
    if (!permiso)
      throw new NotFoundException(
        'El usuario no tiene permisos sobre esta carpeta',
      );

    permiso.permissions = dto.permissions;
    await carpeta.save();

    await this.actividadService.registrar(
      userId,
      Accion.PERMISO_MODIFICADO,
      TipoRecurso.PERMISO,
      carpeta._id,
      carpeta.name,
      {
        usuario: usuarioId,
        permisos: dto.permissions,
        tipoRecurso: TipoRecurso.CARPETA,
      },
    );

    return this.listarComparticiones(id, userId);
  }

  async revocarPermiso(id: string, usuarioId: string, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    const permisos = (carpeta.shareWith ?? []).filter(
      (p) => this.idDe(p.user) !== usuarioId,
    );
    if (permisos.length === (carpeta.shareWith ?? []).length) {
      throw new NotFoundException(
        'El usuario no tiene permisos sobre esta carpeta',
      );
    }

    carpeta.shareWith = permisos;
    await carpeta.save();

    await this.actividadService.registrar(
      userId,
      Accion.PERMISO_REVOCADO,
      TipoRecurso.PERMISO,
      carpeta._id,
      carpeta.name,
      { usuario: usuarioId, tipoRecurso: TipoRecurso.CARPETA },
    );

    return this.listarComparticiones(id, userId);
  }

  async listarComparticiones(id: string, userId: string) {
    const carpeta = await this.obtenerCarpeta(id);
    this.validarPropietario(carpeta, userId);

    return this.carpetaModel
      .findById(id)
      .populate('shareWith.user', 'username name lastname status');
  }

  async recibidas(userId: string) {
    return this.carpetaModel
      .find({
        'shareWith.user': new Types.ObjectId(userId),
        inTrash: false,
        isVisible: true,
      })
      .populate('owner', 'username name lastname')
      .sort({ name: 1 });
  }

  async recalcularTamanio(carpetaIds: unknown[]) {
    const ids = [
      ...new Set(
        carpetaIds
          .map((id) => this.idDe(id))
          .filter((id) => Types.ObjectId.isValid(id)),
      ),
    ];

    for (const id of ids) {
      const resultado = await this.archivoModel.aggregate<{
        _id: null;
        total: number;
      }>([
        {
          $match: {
            ancestors: new Types.ObjectId(id),
            inTrash: false,
            isVisible: true,
          },
        },
        { $group: { _id: null, total: { $sum: '$size' } } },
      ]);

      await this.carpetaModel.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { size: resultado[0]?.total ?? 0 } },
      );
    }
  }

  private async recalcularVisibilidad(
    raiz: Carpeta & { _id?: Types.ObjectId },
  ) {
    const cola: (Carpeta & {
      _id: Types.ObjectId;
      save: () => Promise<unknown>;
    })[] = [raiz as never];

    while (cola.length) {
      const actual = cola.shift();
      if (!actual) continue;

      const hijosVisibles = actual.isVisible && !actual.inTrash;

      const subcarpetas = await this.carpetaModel.find({
        parentFolder: actual._id,
      });
      for (const hija of subcarpetas) {
        hija.isVisible = hijosVisibles && !hija.inTrash;
        await hija.save();
        cola.push(hija);
      }

      const archivos = await this.archivoModel.find({
        parentFolder: actual._id,
      });
      for (const archivo of archivos) {
        archivo.isVisible = hijosVisibles && !archivo.inTrash;
        await archivo.save();
      }
    }
  }
}
