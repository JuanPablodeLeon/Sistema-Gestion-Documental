import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Usuario } from "./Usuario.schema";

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
    parentFolder: Carpeta|Types.ObjectId | null;

    @Prop({
        default: 0,
    })
    size?: number; //tamaño del contenido de la carpeta <- Calculo con funciones de sumatoria nativa

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',
        required: true,
    })
    owner: Usuario | Types.ObjectId;

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Usuario'
        }]
    })
    editors?: (Usuario | Types.ObjectId)[]; //pueden agregar archivos a la carpeta, pero no pueden eliminarla ni modificarla

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Usuario'
        }]
    })
    lectures?: (Usuario | Types.ObjectId)[]; // solo pueden ver el contenido de la carpeta, pero no pueden modificarla ni agregar archivos a ella

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