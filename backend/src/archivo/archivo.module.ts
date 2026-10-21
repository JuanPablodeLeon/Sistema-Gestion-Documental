import { Module } from '@nestjs/common';
import { ArchivoService } from './archivo.service';
import { ArchivoController } from './archivo.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { Usuario, UsuarioSchema } from 'src/schemas/Usuario.schema';
import { PermisosDoc, PermisosDocSchema } from 'src/schemas/PermisosDoc.schema';
import { Comentario, ComentarioSchema } from 'src/schemas/Comentario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: Archivo.name,
      schema: ArchivoSchema
    },
    {
      name: Carpeta.name,
      schema: CarpetaSchema
    },
    {
      name: Usuario.name,
      schema: UsuarioSchema
    },
    {
      name: PermisosDoc.name,
      schema: PermisosDocSchema
    },
    {
      name: Comentario.name,
      schema: ComentarioSchema
    }
    ]),
  ],
  controllers: [ArchivoController],
  providers: [ArchivoService],
})
export class ArchivoModule { }
