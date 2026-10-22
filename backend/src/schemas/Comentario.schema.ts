import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { Usuario } from './Usuario.schema';

//Posible modificacion para manejo de borrado/busqueda
@Schema({
  timestamps: true,
})
export class Comentario {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  })
  user: Usuario | Types.ObjectId;

  @Prop({
    required: true,
  })
  texto: string;

  @Prop({
    required: true,
    default: false,
  })
  isReported: boolean;

  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
