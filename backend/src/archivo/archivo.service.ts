import { Injectable } from '@nestjs/common';
import { CreateArchivoDto } from './dto/create-archivo.dto';
import { UpdateArchivoDto } from './dto/update-archivo.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Archivo } from 'src/schemas/Archivo.schema';
import { Model } from 'mongoose';

@Injectable()
export class ArchivoService {
  constructor(
      @InjectModel(Archivo.name) private readonly archivoModel: Model<Archivo>
    ){}
  create(createArchivoDto: CreateArchivoDto) {
    return 'This action adds a new archivo';
  }

  findAll() {
    return `This action returns all archivo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} archivo`;
  }

  update(id: number, updateArchivoDto: UpdateArchivoDto) {
    return `This action updates a #${id} archivo`;
  }

  remove(id: number) {
    return `This action removes a #${id} archivo`;
  }
}
