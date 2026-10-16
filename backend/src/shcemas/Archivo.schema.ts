import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Usuario } from "./Usuario.schema";
import { Comentario } from "./Comentarios.schema";
import { Carpeta } from "./Carpeta.schema";
//Pendiente agregar el cuando fue a papelera o restaurado
@Schema({
    timestamps: true,
})
export class Archivo{

    @Prop({
        required: true,
    })
    name: string;

    @Prop({
        required: true,
    })
    type: string; // agregar enum de .txt y .md

    @Prop({ 
        type: Types.ObjectId, ref: 'Carpeta', 
        default: null 
    })
    parentFolder: Carpeta|Types.ObjectId | null; //la ruta completa de donde se encuentra el archivo <- Se puede mejorar

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
        type: Buffer,
    })
    content: Buffer; //se va a pasar el texto del archivo <- Mejorar con funciones nativas

    @Prop({
        required: true,
        default: false,
    })
    inTrash: boolean; //solo el owner puede mandarlo/restaurarlo de la papelera, los editors y lectures no pueden hacerlo

    @Prop({
        required: true,
        default: true,
    })
    isVisible: boolean; //Cuando su carpeta o carpeta padre este en papelera see vuelve invisible, pero cuando se restaure la carpeta padre, se vuelve visible de nuevo. Solo el owner puede cambiar este valor, los editors y lectures no pueden hacerlo

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Usuario'
        }]
    })
    editors?: (Usuario | Types.ObjectId)[]; //pueden modificar el contenido del archivo, pero no pueden eliminarlo ni cambiarle el nombre

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Usuario'
        }]
    })
    lectures?: (Usuario | Types.ObjectId)[]; //solo pueden ver el contenido del archivo, pero no pueden modificarlo ni eliminarlo ni cambiarle el nombre

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Comentario'
        }]
    })
    comentarios?: (Comentario | Types.ObjectId)[]; //no importa si es editor o lecture, puede comentar en el archivo, pero no puede modificarlo ni eliminarlo
}

export const ArchivoSchema = SchemaFactory.createForClass(Archivo);