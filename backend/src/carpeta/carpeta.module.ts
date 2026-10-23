import { Module } from '@nestjs/common';
import { CarpetaService } from './carpeta.service';
import { CarpetaController } from './carpeta.controller';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from 'src/schemas/Usuario.schema';
import { Comentario, ComentarioSchema } from 'src/schemas/Comentario.schema';
import { PermisosDoc, PermisosDocSchema } from 'src/schemas/PermisosDoc.schema';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';
import { ActividadModule } from 'src/actividad/actividad.module';
import { SeguridadModule } from 'src/common/seguridad/seguridad.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Carpeta.name,
        schema: CarpetaSchema,
      },
      {
        name: Archivo.name,
        schema: ArchivoSchema,
      },
      {
        name: Usuario.name,
        schema: UsuarioSchema,
      },
      {
        name: Comentario.name,
        schema: ComentarioSchema,
      },
      {
        name: PermisosDoc.name,
        schema: PermisosDocSchema,
      },
    ]),
    ActividadModule,
    SeguridadModule,
  ],
  controllers: [CarpetaController],
  providers: [CarpetaService],
  exports: [CarpetaService],
})
export class CarpetaModule {}
