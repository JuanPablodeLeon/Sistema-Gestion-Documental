import { Module } from '@nestjs/common';
import { CarpetaService } from './carpeta.service';
import { CarpetaController } from './carpeta.controller';
import { Carpeta, CarpetaSchema } from 'src/shcemas/Carpeta.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[
      MongooseModule.forFeature([{
        name: Carpeta.name,
        schema: CarpetaSchema
      }]),
    ],
  controllers: [CarpetaController],
  providers: [CarpetaService],
})
export class CarpetaModule {}
