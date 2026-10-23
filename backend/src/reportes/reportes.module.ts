import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';
import { Carpeta, CarpetaSchema } from 'src/schemas/Carpeta.schema';
import { Usuario, UsuarioSchema } from 'src/schemas/Usuario.schema';
import { Actividad, ActividadSchema } from 'src/schemas/Actividad.schema';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Archivo.name, schema: ArchivoSchema },
      { name: Carpeta.name, schema: CarpetaSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Actividad.name, schema: ActividadSchema },
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
