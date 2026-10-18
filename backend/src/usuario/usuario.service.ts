import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario } from 'src/schemas/Usuario.schema';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>
  ){}
  async create(createUsuarioDto: CreateUsuarioDto) {
    const user = {
      ...createUsuarioDto,
      password: await bcryptjs.hash(createUsuarioDto.password, 12)
    }

    return this.usuarioModel.create(user);
  }

  findAll() {
    return this.usuarioModel.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} usuario`;
  }

  findByUsername(username: string){
    return this.usuarioModel.findOne({username});
  }
  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
