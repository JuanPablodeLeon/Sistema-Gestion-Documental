import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Actividad, ActividadSchema } from 'src/schemas/Actividad.schema';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { ActividadController } from './actividad.controller';
import { ActividadService } from './actividad.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Actividad.name, schema: ActividadSchema },
      { name: Archivo.name, schema: ArchivoSchema },
      { name: Carpeta.name, schema: CarpetaSchema },
    ]),
  ],
  controllers: [ActividadController],
  providers: [ActividadService],
  exports: [ActividadService],
})
export class ActividadModule {}
