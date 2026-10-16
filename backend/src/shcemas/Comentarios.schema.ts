import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Usuario } from "./Usuario.schema";

@Schema({
    timestamps: true,
})
export class Comentario {

    @Prop({
        type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',
        required: true
    })
    user:Usuario | Types.ObjectId;

    @Prop({
        required: true
    })
    texto: string;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);