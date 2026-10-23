import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Carpeta } from 'src/schemas/Carpeta.schema';
import { Comentario } from 'src/schemas/Comentario.schema';
import { PermisosService } from 'src/common/seguridad/permisos.service';
import { ActividadService } from 'src/actividad/actividad.service';
import { Accion, TipoRecurso } from 'src/schemas/Actividad.schema';
import { PermissionType } from 'src/schemas/PermisosDoc.schema';
import { CreateComentarioDto } from './dto/create-comentario.dto';

type TipoComentario = 'archivo' | 'carpeta';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Archivo.name) private readonly archivoModel: Model<Archivo>,
    @InjectModel(Carpeta.name) private readonly carpetaModel: Model<Carpeta>,
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

  private async obtenerRecurso(
    tipo: TipoComentario,
    id: string,
    userId: string,
    permiso: PermissionType,
  ) {
    if (tipo === 'archivo') {
      const archivo = await this.permisosService.assertArchivo(
        userId,
        id,
        permiso,
      );
      if (
        (archivo.inTrash || !archivo.isVisible) &&
        !this.permisosService.esPropietario(archivo, userId)
      ) {
        throw new ForbiddenException('El archivo no se encuentra disponible');
      }
      return { recurso: archivo, tipoRecurso: TipoRecurso.ARCHIVO };
    }

    const carpeta = await this.permisosService.assertCarpeta(
      userId,
      id,
      permiso,
    );
    if (
      (carpeta.inTrash || !carpeta.isVisible) &&
      !this.permisosService.esPropietario(carpeta, userId)
    ) {
      throw new ForbiddenException('La carpeta no se encuentra disponible');
    }
    return { recurso: carpeta, tipoRecurso: TipoRecurso.CARPETA };
  }

  private async comentariosDe(tipo: TipoComentario, id: string) {
    if (tipo === 'archivo') {
      const recurso = await this.archivoModel
        .findById(id)
        .select('comentarios')
        .populate('comentarios.user', 'username name lastname');
      return recurso?.comentarios ?? [];
    }

    const recurso = await this.carpetaModel
      .findById(id)
      .select('comentarios')
      .populate('comentarios.user', 'username name lastname');
    return recurso?.comentarios ?? [];
  }

  private async ultimoComentario(tipo: TipoComentario, id: string) {
    const comentarios = await this.comentariosDe(tipo, id);
    return comentarios[comentarios.length - 1] as Comentario | undefined;
  }

  async listar(tipo: TipoComentario, id: string, userId: string) {
    await this.obtenerRecurso(tipo, id, userId, PermissionType.READ);
    return this.comentariosDe(tipo, id);
  }

  async crear(
    tipo: TipoComentario,
    id: string,
    dto: CreateComentarioDto,
    userId: string,
  ) {
    const { recurso, tipoRecurso } = await this.obtenerRecurso(
      tipo,
      id,
      userId,
      PermissionType.COMMENT,
    );

    if (!recurso.comentarios) recurso.comentarios = [];
    recurso.comentarios.push({
      user: new Types.ObjectId(userId),
      texto: dto.texto,
      isReported: false,
    });
    await recurso.save();

    const creado = await this.ultimoComentario(tipo, id);

    await this.actividadService.registrar(
      userId,
      Accion.COMENTARIO_CREADO,
      TipoRecurso.COMENTARIO,
      creado?._id ?? recurso._id,
      String(recurso.name ?? ''),
      { recurso: recurso._id, tipoRecurso },
    );

    return creado;
  }

  async reportar(
    tipo: TipoComentario,
    id: string,
    comentarioId: string,
    userId: string,
  ) {
    const { recurso, tipoRecurso } = await this.obtenerRecurso(
      tipo,
      id,
      userId,
      PermissionType.READ,
    );

    const comentario = (recurso.comentarios ?? []).find(
      (c) => this.idDe(c._id) === comentarioId,
    );
    if (!comentario) throw new NotFoundException('Comentario no encontrado');

    if (comentario.isReported) {
      throw new BadRequestException('Este comentario ya fue reportado');
    }

    comentario.isReported = true;
    comentario.reportedBy = new Types.ObjectId(userId);
    comentario.reportedAt = new Date();
    await recurso.save();

    await this.actividadService.registrar(
      userId,
      Accion.COMENTARIO_REPORTADO,
      TipoRecurso.COMENTARIO,
      comentarioId,
      String(recurso.name ?? ''),
      {
        recurso: recurso._id,
        tipoRecurso,
        comentario: comentario.texto,
        autor: this.idDe(comentario.user),
      },
    );

    return {
      message: 'Comentario reportado. Se notificó a los administradores.',
      id: comentarioId,
    };
  }
}
