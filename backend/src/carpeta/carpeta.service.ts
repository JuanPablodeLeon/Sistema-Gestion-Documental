import { Injectable } from '@nestjs/common';
import { CreateCarpetaDto } from './dto/create-carpeta.dto';
import { UpdateCarpetaDto } from './dto/update-carpeta.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Carpeta } from 'src/schemas/Carpeta.schema';

@Injectable()
export class CarpetaService {
  constructor(
      @InjectModel(Carpeta.name) private readonly carpetaModel: Model<Carpeta>
    ){}
  create(createCarpetaDto: CreateCarpetaDto) {
    return 'This action adds a new carpeta';
  }

  findAll() {
    return `This action returns all carpeta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} carpeta`;
  }

  update(id: number, updateCarpetaDto: UpdateCarpetaDto) {
    return `This action updates a #${id} carpeta`;
  }

  remove(id: number) {
    return `This action removes a #${id} carpeta`;
  }
}
