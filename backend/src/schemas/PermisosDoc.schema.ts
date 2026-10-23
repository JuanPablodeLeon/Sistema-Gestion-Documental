import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { Usuario } from './Usuario.schema';

export enum PermissionType {
  READ = 'read',
  COMMENT = 'comment',
  EDIT = 'edit',
}

export enum NivelAcceso {
  READ = 'read',
  READ_COMMENT = 'read_comment',
  EDIT = 'edit',
  EDIT_COMMENT = 'edit_comment',
}

export const PERMISOS_POR_NIVEL: Record<NivelAcceso, PermissionType[]> = {
  [NivelAcceso.READ]: [PermissionType.READ],
  [NivelAcceso.READ_COMMENT]: [PermissionType.READ, PermissionType.COMMENT],
  [NivelAcceso.EDIT]: [PermissionType.EDIT],
  [NivelAcceso.EDIT_COMMENT]: [PermissionType.EDIT, PermissionType.COMMENT],
};

export function permisosDeNivel(nivel: NivelAcceso): PermissionType[] {
  return [...PERMISOS_POR_NIVEL[nivel]];
}

@Schema({
  _id: false,
})
export class PermisosDoc {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  })
  user: Usuario | Types.ObjectId;

  @Prop({
    type: [String],
    enum: Object.values(PermissionType),
    required: true,
  })
  permissions: PermissionType[];
}

export const PermisosDocSchema = SchemaFactory.createForClass(PermisosDoc);
