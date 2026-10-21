import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from 'src/common/enums/rol.enum';

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
        required: true,
        select: false
    })
    password: string;

    @Prop({
        required: true,
        type: 'enum',
        enum: Role,
        default:Role.USER
    })
    role: Role;

    @Prop({
        required: true,
        default: true
    })
    status: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);