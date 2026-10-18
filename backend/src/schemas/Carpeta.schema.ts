import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Usuario } from "./Usuario.schema";
import { Comentario, ComentarioSchema } from "./Comentario.schema";
import { PermisosDoc, PermisosDocSchema } from "./PermisosDoc.schema";

@Schema({
    timestamps: true,
})
export class Carpeta {

    @Prop({
        required: true,
    })
    name: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta',
        default: null
    })
    parentFolder: Carpeta | Types.ObjectId | null;

    @Prop({ type: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta' }], 
        default: [] 
    })
    ancestors: (Carpeta | Types.ObjectId)[];

    @Prop({
        default: 0,
    })
    size?: number; //tamaño del contenido de la carpeta <- Calculó con funciones de sumatoria nativa

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',
        required: true,
    })
    owner: Usuario | Types.ObjectId;

    @Prop({
        type: [PermisosDocSchema],
        default: [],
    })
    shareWith?: PermisosDoc[];

    @Prop({
        type: [ComentarioSchema],
        default: [],
    })
    comentarios?: Comentario[]; //lista de comentarios en el archivo

    @Prop({
        required: true,
        default: false,
    })
    inTrash: boolean;

    @Prop({
        required: true,
        default: true,
    })
    isVisible: boolean;
}

export const CarpetaSchema = SchemaFactory.createForClass(Carpeta);