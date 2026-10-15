import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Usuario } from "./Usuario.schema";

@Schema()
export class Comentario {

    @Prop({
        type: [{
            type: mongoose.Schema.Types.ObjectId, ref: 'Usuario'
        }],
        require: true
    })
    user:string;

    @Prop({
        required: true
    })
    texto: string;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);