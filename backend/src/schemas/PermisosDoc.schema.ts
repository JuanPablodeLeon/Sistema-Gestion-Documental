import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Usuario } from "./Usuario.schema";

export enum PermissionType{
    READ = 'read',
    COMMENT = 'comment',
    EDIT = 'edit'
}

@Schema({
    _id: false,
})
export class PermisosDoc {
  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',
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