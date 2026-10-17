import { Injectable } from '@nestjs/common';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comentario } from 'src/shcemas/Comentario.schema';

@Injectable()
export class ComentariosService {
  constructor(
      @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>
    ){}
  create(createComentarioDto: CreateComentarioDto) {
    return 'This action adds a new comentario';
  }

  findAll() {
    return `This action returns all comentarios`;
  }

  findOne(id: number) {
    return `This action returns a #${id} comentario`;
  }

  update(id: number, updateComentarioDto: UpdateComentarioDto) {
    return `This action updates a #${id} comentario`;
  }

  remove(id: number) {
    return `This action removes a #${id} comentario`;
  }
}
