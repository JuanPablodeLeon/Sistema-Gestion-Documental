import { Module } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from 'src/schemas/Usuario.schema';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { SeguridadModule } from 'src/common/seguridad/seguridad.module';
import { ActividadModule } from 'src/actividad/actividad.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Archivo.name, schema: ArchivoSchema },
      { name: Carpeta.name, schema: CarpetaSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
    SeguridadModule,
    ActividadModule,
  ],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
