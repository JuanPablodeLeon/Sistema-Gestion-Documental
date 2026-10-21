import { Module } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';
import { Comentario, ComentarioSchema } from 'src/schemas/Comentario.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from 'src/schemas/Usuario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: Comentario.name,
      schema: ComentarioSchema
    },
    {
      name: Usuario.name,
      schema: UsuarioSchema
    }]),
  ],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule { }
