import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Carpeta } from 'src/schemas/Carpeta.schema';
import { PermissionType } from 'src/schemas/PermisosDoc.schema';

export type PermisoEfectivo = 'owner' | PermissionType;

@Injectable()
export class PermisosService {
  constructor(
    @InjectModel(Archivo.name) private readonly archivoModel: Model<Archivo>,
    @InjectModel(Carpeta.name) private readonly carpetaModel: Model<Carpeta>,
  ) {}

  private idDe(valor: unknown): string {
    if (!valor) return '';
    if (valor instanceof Types.ObjectId) return valor.toString();
    if (typeof valor === 'string') return valor;
    const posible = valor as { _id?: Types.ObjectId };
    return posible._id ? posible._id.toString() : '';
  }

  private maxPermiso(permisos: PermissionType[]): PermissionType | null {
    if (permisos.includes(PermissionType.EDIT)) return PermissionType.EDIT;
    if (permisos.includes(PermissionType.COMMENT))
      return PermissionType.COMMENT;
    if (permisos.includes(PermissionType.READ)) return PermissionType.READ;
    return null;
  }

  private permisosDeComparticion(
    recurso: { shareWith?: { user: unknown; permissions: PermissionType[] }[] },
    userId: string,
  ) {
    const permisos: PermissionType[] = [];
    for (const item of recurso.shareWith ?? []) {
      if (this.idDe(item.user) === userId) permisos.push(...item.permissions);
    }
    return permisos;
  }

  private permite(
    permiso: PermisoEfectivo | null,
    requerido: PermissionType,
  ): boolean {
    if (permiso === 'owner' || permiso === PermissionType.EDIT) return true;
    if (requerido === PermissionType.READ) {
      return (
        permiso === PermissionType.READ || permiso === PermissionType.COMMENT
      );
    }
    if (requerido === PermissionType.COMMENT) {
      return permiso === PermissionType.COMMENT;
    }
    return false;
  }

  async permisoArchivo(
    userId: string,
    archivo: Archivo,
  ): Promise<PermisoEfectivo | null> {
    if (this.idDe(archivo.owner) === userId) return 'owner';

    const permisos = this.permisosDeComparticion(archivo, userId);

    if (archivo.ancestors?.length) {
      const esDuenioDeCarpeta = await this.carpetaModel.exists({
        _id: { $in: archivo.ancestors },
        owner: new Types.ObjectId(userId),
      });
      if (esDuenioDeCarpeta) return 'owner';

      const carpetas = await this.carpetaModel
        .find({ _id: { $in: archivo.ancestors }, 'shareWith.user': userId })
        .select('shareWith');
      for (const carpeta of carpetas)
        permisos.push(...this.permisosDeComparticion(carpeta, userId));
    }

    return this.maxPermiso(permisos);
  }

  async permisoCarpeta(
    userId: string,
    carpeta: Carpeta,
  ): Promise<PermisoEfectivo | null> {
    if (this.idDe(carpeta.owner) === userId) return 'owner';

    const permisos = this.permisosDeComparticion(carpeta, userId);

    if (carpeta.ancestors?.length) {
      const esDuenioDeCarpeta = await this.carpetaModel.exists({
        _id: { $in: carpeta.ancestors },
        owner: new Types.ObjectId(userId),
      });
      if (esDuenioDeCarpeta) return 'owner';

      const ancestros = await this.carpetaModel
        .find({ _id: { $in: carpeta.ancestors }, 'shareWith.user': userId })
        .select('shareWith');
      for (const ancestro of ancestros)
        permisos.push(...this.permisosDeComparticion(ancestro, userId));
    }

    return this.maxPermiso(permisos);
  }

  async assertArchivo(
    userId: string,
    archivoId: string,
    requerido: PermissionType = PermissionType.READ,
  ) {
    const archivo = await this.archivoModel.findById(archivoId);
    if (!archivo) throw new NotFoundException('Archivo no encontrado');

    const permiso = await this.permisoArchivo(userId, archivo);
    if (!this.permite(permiso, requerido)) {
      throw new ForbiddenException('No tiene permisos sobre este archivo');
    }
    return archivo;
  }

  async assertCarpeta(
    userId: string,
    carpetaId: string,
    requerido: PermissionType = PermissionType.READ,
  ) {
    const carpeta = await this.carpetaModel.findById(carpetaId);
    if (!carpeta) throw new NotFoundException('Carpeta no encontrada');

    const permiso = await this.permisoCarpeta(userId, carpeta);
    if (!this.permite(permiso, requerido)) {
      throw new ForbiddenException('No tiene permisos sobre esta carpeta');
    }
    return carpeta;
  }

  async getAccessibleFolderIds(userId: string): Promise<Types.ObjectId[]> {
    const propias = await this.carpetaModel
      .find({ owner: new Types.ObjectId(userId) })
      .select('_id')
      .lean();
    const compartidas = await this.carpetaModel
      .find({ 'shareWith.user': new Types.ObjectId(userId) })
      .select('_id')
      .lean();

    const directas = [...propias, ...compartidas].map((c) => c._id);
    if (!directas.length) return [];

    const descendientes = await this.carpetaModel
      .find({ ancestors: { $in: directas } })
      .select('_id')
      .lean();

    const unicas = new Map<string, Types.ObjectId>();
    for (const item of [...directas, ...descendientes.map((c) => c._id)]) {
      unicas.set(item.toString(), item);
    }
    return [...unicas.values()];
  }

  esPropietario(recurso: { owner: unknown }, userId: string) {
    return this.idDe(recurso.owner) === userId;
  }
}
