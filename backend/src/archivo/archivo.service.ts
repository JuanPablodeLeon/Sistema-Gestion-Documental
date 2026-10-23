import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Carpeta } from 'src/schemas/Carpeta.schema';
import { Usuario } from 'src/schemas/Usuario.schema';
import { ActividadService } from 'src/actividad/actividad.service';
import { Accion, TipoRecurso } from 'src/schemas/Actividad.schema';
import { PermisosService } from 'src/common/seguridad/permisos.service';
import {
  PermissionType,
  permisosDeNivel,
} from 'src/schemas/PermisosDoc.schema';
import { CarpetaService } from 'src/carpeta/carpeta.service';
import { CreateArchivoDto } from './dto/create-archivo.dto';
import { UpdateArchivoDto } from './dto/update-archivo.dto';
import { MoverArchivoDto } from './dto/mover-archivo.dto';
import { CompartirDto, CompartirLoteDto } from 'src/common/dto/compartir.dto';

type FiltroArchivo = {
  parentFolder?: string;
  q?: string;
  type?: string;
  trash?: string;
  desde?: string;
  hasta?: string;
  page?: string;
  limit?: string;
  sort?: string;
};

@Injectable()
export class ArchivoService {
  constructor(
    @InjectModel(Archivo.name) private readonly archivoModel: Model<Archivo>,
    @InjectModel(Carpeta.name) private readonly carpetaModel: Model<Carpeta>,
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    private readonly permisosService: PermisosService,
    private readonly carpetaService: CarpetaService,
    private readonly actividadService: ActividadService,
  ) {}

  private idDe(valor: unknown): string {
    if (!valor) return '';
    if (valor instanceof Types.ObjectId) return valor.toString();
    if (typeof valor === 'string') return valor;
    const posible = valor as { _id?: Types.ObjectId };
    return posible._id ? posible._id.toString() : '';
  }

  private async obtenerArchivo(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Identificador de archivo inválido');
    const archivo = await this.archivoModel.findById(id);
    if (!archivo) throw new NotFoundException('Archivo no encontrado');
    return archivo;
  }

  private validarPropietario(archivo: Archivo, userId: string) {
    if (!this.permisosService.esPropietario(archivo, userId)) {
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

  private async obtenerPadre(
    parentFolderId: string | undefined,
    userId: string,
  ) {
    if (!parentFolderId) return null;
    if (!Types.ObjectId.isValid(parentFolderId)) {
      throw new BadRequestException('Identificador de carpeta padre inválido');
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

  private resolverTipo(name: string, tipo?: string) {
    const extension = name.split('.').pop()?.toLowerCase();
    const tipoNormalizado = tipo?.toLowerCase();

    if (extension === 'txt' || extension === 'md') {
      if (tipoNormalizado && tipoNormalizado !== extension) {
        throw new BadRequestException(
          'La extensión del archivo no coincide con el tipo indicado',
        );
      }
      return extension;
    }

    if (tipoNormalizado === 'txt' || tipoNormalizado === 'md')
      return tipoNormalizado;

    throw new BadRequestException(
      'Solo se permiten archivos con extensión .txt o .md',
    );
  }

  async create(createArchivoDto: CreateArchivoDto, userId: string) {
    const padre = await this.obtenerPadre(
      createArchivoDto.parentFolder,
      userId,
    );
    const nombre = createArchivoDto.name.trim();
    const tipo = this.resolverTipo(nombre, createArchivoDto.type);

    const archivo = await this.archivoModel.create({
      name: nombre,
      type: tipo,
      parentFolder: padre ? padre._id : null,
      ancestors: padre ? [...padre.ancestors, padre._id] : [],
      size: Buffer.byteLength(createArchivoDto.content, 'utf8'),
      owner: new Types.ObjectId(userId),
      content: createArchivoDto.content,
      inTrash: false,
      isVisible: true,
      shareWith: [],
      comentarios: [],
    });

    if (padre)
      await this.carpetaService.recalcularTamanio([
        ...padre.ancestors,
        padre._id,
      ]);

    await this.actividadService.registrar(
      userId,
      Accion.ARCHIVO_CREADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      {
        type: archivo.type,
        size: archivo.size,
        parentFolder: padre ? padre._id : null,
      },
    );

    return archivo;
  }

  async findAll(userId: string, filtro: FiltroArchivo = {}) {
    const query: QueryFilter<Archivo> = {};

    if (filtro.trash === 'true') {
      query.owner = new Types.ObjectId(userId);
      query.inTrash = true;
    } else {
      const carpetasAccesibles =
        await this.permisosService.getAccessibleFolderIds(userId);
      query.$or = [
        { owner: new Types.ObjectId(userId) },
        { 'shareWith.user': new Types.ObjectId(userId) },
        { ancestors: { $in: carpetasAccesibles } },
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

    if (filtro.type) {
      if (!['txt', 'md'].includes(filtro.type))
        throw new BadRequestException('Tipo de archivo inválido');
      query.type = filtro.type;
    }

    if (filtro.q) {
      const regex = {
        $regex: filtro.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
      query.$and = [{ $or: [{ name: regex }, { content: regex }] }];
    }

    if (filtro.desde || filtro.hasta) {
      query.createdAt = {};
      if (filtro.desde) query.createdAt.$gte = new Date(filtro.desde);
      if (filtro.hasta) query.createdAt.$lte = new Date(filtro.hasta);
    }

    const page = Math.max(1, Number(filtro.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filtro.limit) || 50));
    const orden: Record<string, 1 | -1> =
      filtro.sort === 'nombre'
        ? { name: 1 }
        : filtro.sort === 'tamanio'
          ? { size: -1 }
          : { createdAt: -1 };

    const [items, total] = await Promise.all([
      this.archivoModel
        .find(query)
        .select('-content')
        .populate('owner', 'username name lastname')
        .sort(orden)
        .skip((page - 1) * limit)
        .limit(limit),
      this.archivoModel.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const archivo = await this.permisosService.assertArchivo(
      userId,
      id,
      PermissionType.READ,
    );

    if (
      (archivo.inTrash || !archivo.isVisible) &&
      !this.permisosService.esPropietario(archivo, userId)
    ) {
      throw new ForbiddenException('El archivo no se encuentra disponible');
    }

    const permiso = await this.permisosService.permisoArchivo(userId, archivo);

    const detalle = await this.archivoModel
      .findById(id)
      .populate('owner', 'username name lastname')
      .populate('shareWith.user', 'username name lastname status')
      .populate('comentarios.user', 'username name lastname');

    if (!detalle) throw new NotFoundException('Archivo no encontrado');

    return { ...detalle.toObject(), permiso };
  }

  async descargar(id: string, userId: string) {
    const archivo = await this.permisosService.assertArchivo(
      userId,
      id,
      PermissionType.READ,
    );

    if (archivo.inTrash || !archivo.isVisible) {
      throw new ForbiddenException('El archivo no se encuentra disponible');
    }

    await this.actividadService.registrar(
      userId,
      Accion.ARCHIVO_DESCARGADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
    );

    return archivo;
  }

  async update(id: string, updateArchivoDto: UpdateArchivoDto, userId: string) {
    const archivo = await this.permisosService.assertArchivo(
      userId,
      id,
      PermissionType.EDIT,
    );

    if (archivo.inTrash)
      throw new BadRequestException(
        'No se puede modificar un archivo de la papelera',
      );

    const esPropietario = this.permisosService.esPropietario(archivo, userId);
    const cambios: string[] = [];

    if (updateArchivoDto.name !== undefined) {
      if (!esPropietario)
        throw new ForbiddenException(
          'Solo el propietario puede renombrar el archivo',
        );

      const nombre = updateArchivoDto.name.trim();
      archivo.type = this.resolverTipo(nombre, archivo.type);
      archivo.name = nombre;
      cambios.push('name');
    }

    if (updateArchivoDto.content !== undefined) {
      archivo.content = updateArchivoDto.content;
      archivo.size = Buffer.byteLength(updateArchivoDto.content, 'utf8');
      cambios.push('content');
    }

    await archivo.save();

    if (archivo.ancestors.length) {
      await this.carpetaService.recalcularTamanio(archivo.ancestors);
    }

    await this.actividadService.registrar(
      userId,
      updateArchivoDto.name !== undefined &&
        updateArchivoDto.content === undefined
        ? Accion.ARCHIVO_RENOMBRADO
        : Accion.ARCHIVO_ACTUALIZADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      { campos: cambios },
    );

    return archivo;
  }

  async mover(id: string, moverArchivoDto: MoverArchivoDto, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    if (archivo.inTrash)
      throw new BadRequestException(
        'No se puede mover un archivo de la papelera',
      );

    const padre = await this.obtenerPadre(moverArchivoDto.parentFolder, userId);
    const ancestrosAnteriores = archivo.ancestors.map((a) => this.idDe(a));

    if (padre && this.idDe(padre._id) === this.idDe(archivo.parentFolder)) {
      return archivo;
    }

    archivo.parentFolder = padre ? padre._id : null;
    archivo.ancestors = padre ? [...padre.ancestors, padre._id] : [];
    await archivo.save();

    const afectadas = [
      ...ancestrosAnteriores,
      ...archivo.ancestors.map((a) => this.idDe(a)),
    ];
    await this.carpetaService.recalcularTamanio(afectadas);

    await this.actividadService.registrar(
      userId,
      Accion.ARCHIVO_MOVIDO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
      {
        anterior: ancestrosAnteriores,
        nuevo: archivo.ancestors.map((a) => this.idDe(a)),
      },
    );

    return archivo;
  }

  async remove(id: string, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    if (archivo.inTrash)
      throw new BadRequestException(
        'El archivo ya se encuentra en la papelera',
      );

    archivo.inTrash = true;
    archivo.isVisible = false;
    await archivo.save();

    await this.carpetaService.recalcularTamanio(archivo.ancestors);

    await this.actividadService.registrar(
      userId,
      Accion.ARCHIVO_ENVIADO_PAPELERA,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
    );

    return { message: 'Archivo enviado a la papelera', id: archivo._id };
  }

  async restaurar(id: string, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    if (!archivo.inTrash)
      throw new BadRequestException(
        'El archivo no se encuentra en la papelera',
      );

    if (archivo.parentFolder) {
      const padre = await this.carpetaModel.findById(archivo.parentFolder);
      if (!padre) throw new NotFoundException('La carpeta padre ya no existe');
      if (padre.inTrash || !padre.isVisible) {
        throw new BadRequestException(
          'Debe restaurar primero la carpeta padre',
        );
      }
    }

    archivo.inTrash = false;
    archivo.isVisible = true;
    await archivo.save();

    await this.carpetaService.recalcularTamanio(archivo.ancestors);

    await this.actividadService.registrar(
      userId,
      Accion.ARCHIVO_RESTAURADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
    );

    return { message: 'Archivo restaurado', id: archivo._id };
  }

  async eliminarDefinitivo(id: string, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    if (!archivo.inTrash) {
      throw new BadRequestException(
        'El archivo debe estar en la papelera para eliminarse definitivamente',
      );
    }

    const ancestros = archivo.ancestors;
    await this.archivoModel.deleteOne({ _id: archivo._id });
    await this.carpetaService.recalcularTamanio(ancestros);

    await this.actividadService.registrar(
      userId,
      Accion.ARCHIVO_ELIMINADO,
      TipoRecurso.ARCHIVO,
      archivo._id,
      archivo.name,
    );

    return { message: 'Archivo eliminado definitivamente', id: archivo._id };
  }

  async findPapelera(userId: string) {
    return this.archivoModel
      .find({ owner: new Types.ObjectId(userId), inTrash: true })
      .select('-content')
      .populate('owner', 'username name lastname')
      .sort({ updatedAt: -1 });
  }

  async compartir(id: string, dto: CompartirDto, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);
    if (archivo.inTrash)
      throw new BadRequestException(
        'No se puede compartir un archivo de la papelera',
      );
    await this.validarUsuarioDestino(dto.userId, userId);

    if (!archivo.shareWith) archivo.shareWith = [];
    const existente = archivo.shareWith.find(
      (p) => this.idDe(p.user) === dto.userId,
    );

    if (existente) {
      existente.permissions = dto.permissions;
      await archivo.save();
      await this.actividadService.registrar(
        userId,
        Accion.PERMISO_MODIFICADO,
        TipoRecurso.PERMISO,
        archivo._id,
        archivo.name,
        {
          usuario: dto.userId,
          permisos: dto.permissions,
          tipoRecurso: TipoRecurso.ARCHIVO,
        },
      );
    } else {
      archivo.shareWith.push({
        user: new Types.ObjectId(dto.userId),
        permissions: dto.permissions,
      });
      await archivo.save();
      await this.actividadService.registrar(
        userId,
        Accion.RECURSO_COMPARTIDO,
        TipoRecurso.PERMISO,
        archivo._id,
        archivo.name,
        {
          usuario: dto.userId,
          permisos: dto.permissions,
          tipoRecurso: TipoRecurso.ARCHIVO,
        },
      );
    }

    return this.listarComparticiones(id, userId);
  }

  async compartirVarios(id: string, dto: CompartirLoteDto, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);
    if (archivo.inTrash)
      throw new BadRequestException(
        'No se puede compartir un archivo de la papelera',
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

    if (!archivo.shareWith) archivo.shareWith = [];

    const cambios: {
      userId: string;
      permissions: PermissionType[];
      nuevo: boolean;
    }[] = [];

    for (const destinatario of destinatarios) {
      const existente = archivo.shareWith.find(
        (p) => this.idDe(p.user) === destinatario.userId,
      );

      if (existente) {
        existente.permissions = destinatario.permissions;
        cambios.push({ ...destinatario, nuevo: false });
      } else {
        archivo.shareWith.push({
          user: new Types.ObjectId(destinatario.userId),
          permissions: destinatario.permissions,
        });
        cambios.push({ ...destinatario, nuevo: true });
      }
    }

    await archivo.save();

    for (const cambio of cambios) {
      await this.actividadService.registrar(
        userId,
        cambio.nuevo ? Accion.RECURSO_COMPARTIDO : Accion.PERMISO_MODIFICADO,
        TipoRecurso.PERMISO,
        archivo._id,
        archivo.name,
        {
          usuario: cambio.userId,
          permisos: cambio.permissions,
          tipoRecurso: TipoRecurso.ARCHIVO,
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
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    const permiso = archivo.shareWith?.find(
      (p) => this.idDe(p.user) === usuarioId,
    );
    if (!permiso)
      throw new NotFoundException(
        'El usuario no tiene permisos sobre este archivo',
      );

    permiso.permissions = dto.permissions;
    await archivo.save();

    await this.actividadService.registrar(
      userId,
      Accion.PERMISO_MODIFICADO,
      TipoRecurso.PERMISO,
      archivo._id,
      archivo.name,
      {
        usuario: usuarioId,
        permisos: dto.permissions,
        tipoRecurso: TipoRecurso.ARCHIVO,
      },
    );

    return this.listarComparticiones(id, userId);
  }

  async revocarPermiso(id: string, usuarioId: string, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    const permisos = (archivo.shareWith ?? []).filter(
      (p) => this.idDe(p.user) !== usuarioId,
    );
    if (permisos.length === (archivo.shareWith ?? []).length) {
      throw new NotFoundException(
        'El usuario no tiene permisos sobre este archivo',
      );
    }

    archivo.shareWith = permisos;
    await archivo.save();

    await this.actividadService.registrar(
      userId,
      Accion.PERMISO_REVOCADO,
      TipoRecurso.PERMISO,
      archivo._id,
      archivo.name,
      { usuario: usuarioId, tipoRecurso: TipoRecurso.ARCHIVO },
    );

    return this.listarComparticiones(id, userId);
  }

  async listarComparticiones(id: string, userId: string) {
    const archivo = await this.obtenerArchivo(id);
    this.validarPropietario(archivo, userId);

    return this.archivoModel
      .findById(id)
      .select('-content')
      .populate('shareWith.user', 'username name lastname status');
  }

  async recibidos(userId: string) {
    return this.archivoModel
      .find({
        'shareWith.user': new Types.ObjectId(userId),
        inTrash: false,
        isVisible: true,
      })
      .select('-content')
      .populate('owner', 'username name lastname')
      .sort({ name: 1 });
  }
}
