import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { PermisosService } from './permisos.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Archivo.name, schema: ArchivoSchema },
      { name: Carpeta.name, schema: CarpetaSchema },
    ]),
  ],
  providers: [PermisosService],
  exports: [PermisosService],
})
export class SeguridadModule {}
