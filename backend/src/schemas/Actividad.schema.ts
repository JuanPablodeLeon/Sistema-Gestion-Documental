import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { Usuario } from './Usuario.schema';

export enum Accion {
  USUARIO_CREADO = 'usuario_creado',
  USUARIO_ACTUALIZADO = 'usuario_actualizado',
  USUARIO_DESACTIVADO = 'usuario_desactivado',

  CARPETA_CREADA = 'carpeta_creada',
  CARPETA_RENOMBRADA = 'carpeta_renombrada',
  CARPETA_MOVIDA = 'carpeta_movida',
  CARPETA_ENVIADA_PAPELERA = 'carpeta_enviada_papelera',
  CARPETA_RESTAURADA = 'carpeta_restaurada',
  CARPETA_ELIMINADA = 'carpeta_eliminada',

  ARCHIVO_CREADO = 'archivo_creado',
  ARCHIVO_ACTUALIZADO = 'archivo_actualizado',
  ARCHIVO_RENOMBRADO = 'archivo_renombrado',
  ARCHIVO_MOVIDO = 'archivo_movido',
  ARCHIVO_DESCARGADO = 'archivo_descargado',
  ARCHIVO_ENVIADO_PAPELERA = 'archivo_enviado_papelera',
  ARCHIVO_RESTAURADO = 'archivo_restaurado',
  ARCHIVO_ELIMINADO = 'archivo_eliminado',

  RECURSO_COMPARTIDO = 'recurso_compartido',
  PERMISO_MODIFICADO = 'permiso_modificado',
  PERMISO_REVOCADO = 'permiso_revocado',

  COMENTARIO_CREADO = 'comentario_creado',
  COMENTARIO_ELIMINADO = 'comentario_eliminado',
}

export enum TipoRecurso {
  USUARIO = 'usuario',
  CARPETA = 'carpeta',
  ARCHIVO = 'archivo',
  COMENTARIO = 'comentario',
  PERMISO = 'permiso',
}

@Schema({
  timestamps: true,
})
export class Actividad {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  })
  user: Usuario | Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(Accion),
  })
  action: Accion;

  @Prop({
    required: true,
    enum: Object.values(TipoRecurso),
  })
  resourceType: TipoRecurso;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  })
  resourceId: Types.ObjectId | null;

  @Prop({
    default: '',
  })
  resourceName: string;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {},
  })
  details: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ActividadSchema = SchemaFactory.createForClass(Actividad);
