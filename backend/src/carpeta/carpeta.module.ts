import { Module } from '@nestjs/common';
import { CarpetaService } from './carpeta.service';
import { CarpetaController } from './carpeta.controller';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from 'src/schemas/Usuario.schema';
import { Comentario, ComentarioSchema } from 'src/schemas/Comentario.schema';
import { PermisosDoc, PermisosDocSchema } from 'src/schemas/PermisosDoc.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: Carpeta.name,
      schema: CarpetaSchema
    },
    {
      name: Usuario.name,
      schema: UsuarioSchema
    },
    {
      name: Comentario.name,
      schema: ComentarioSchema
    },
    {
      name: PermisosDoc.name,
      schema: PermisosDocSchema
    }
    ]),
  ],
  controllers: [CarpetaController],
  providers: [CarpetaService],
})
export class CarpetaModule { }
