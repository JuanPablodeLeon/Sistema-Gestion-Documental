import { Module } from '@nestjs/common';
import { ArchivoService } from './archivo.service';
import { ArchivoController } from './archivo.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Archivo, ArchivoSchema } from 'src/schemas/Archivo.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{
      name: Archivo.name,
      schema: ArchivoSchema
    }]),
  ],
  controllers: [ArchivoController],
  providers: [ArchivoService],
})
export class ArchivoModule {}
