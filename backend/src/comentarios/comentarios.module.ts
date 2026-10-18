import { Module } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';
import { Comentario, ComentarioSchema } from 'src/schemas/Comentario.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[
      MongooseModule.forFeature([{
        name: Comentario.name,
        schema: ComentarioSchema
      }]),
    ],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
