import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
    timestamps: true,
})
export class Usuario {

    @Prop({
        required: true,
        unique: true
    })
    username: string;

    @Prop({
        required: true
    })
    name: string;

    @Prop({
        required: true
    })
    lastname: string;

    @Prop({
        required: true
    })
    password: string;

    @Prop({
        required: true
    })
    rol: string;

    @Prop({
        required: true
    })
    status: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);