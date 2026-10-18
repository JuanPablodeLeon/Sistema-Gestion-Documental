import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Usuario } from "./Usuario.schema";
import { Comentario, ComentarioSchema } from "./Comentario.schema";
import { Carpeta } from "./Carpeta.schema";
import { PermisosDoc, PermisosDocSchema } from "./PermisosDoc.schema";

@Schema({
    timestamps: true,
})
export class Archivo {

    @Prop({
        required: true,
    })
    name: string;

    @Prop({
        required: true,
        enum: ['txt', 'md']
    })
    type: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta',
        default: null
    })
    parentFolder: Carpeta | Types.ObjectId | null; //nombre de en que carpeta se encuentra

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Carpeta'
        }],
        default: []
    })
    ancestors: (Carpeta | Types.ObjectId)[]; //recorrido de que carpetas superiores hay

    @Prop({
        required: true,
    })
    size: number;

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',
        required: true,
    })
    owner: Usuario | Types.ObjectId;

    @Prop({
        required: true,
    })
    content: string; 

    @Prop({
        required: true,
        default: false,
    })
    inTrash: boolean; //solo el owner puede mandarlo/restaurarlo de la papelera, los editors y lectures no pueden hacerlo

    @Prop({
        required: true,
        default: true,
    })
    isVisible: boolean; //Solo owner los modifica, false si su carpeta o superior esta(n) en papelera

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
}

export const ArchivoSchema = SchemaFactory.createForClass(Archivo);