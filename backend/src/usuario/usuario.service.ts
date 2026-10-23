import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario } from 'src/schemas/Usuario.schema';
import { Model, QueryFilter, Types } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { ActividadService } from 'src/actividad/actividad.service';
import { Accion, TipoRecurso } from 'src/schemas/Actividad.schema';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
    private readonly actividadService: ActividadService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto, actorId?: string) {
    const existente = await this.usuarioModel.findOne({
      username: createUsuarioDto.username,
    });
    if (existente)
      throw new ConflictException('El nombre de usuario ya existe');

    const user = {
      ...createUsuarioDto,
      password: await bcryptjs.hash(createUsuarioDto.password, 12),
    };

    const creado = await this.usuarioModel.create(user);

    if (actorId) {
      await this.actividadService.registrar(
        actorId,
        Accion.USUARIO_CREADO,
        TipoRecurso.USUARIO,
        creado._id,
        creado.username,
        { role: creado.role },
      );
    }

    return this.usuarioModel.findById(creado._id);
  }

  findAll() {
    return this.usuarioModel.find();
  }

  buscar(username: string, excluirId?: string) {
    const termino = (username ?? '').trim();
    const query: QueryFilter<Usuario> = { status: true };

    if (termino) {
      query.username = {
        $regex: termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }

    if (excluirId && Types.ObjectId.isValid(excluirId)) {
      query._id = { $ne: new Types.ObjectId(excluirId) };
    }

    return this.usuarioModel
      .find(query)
      .select('username name lastname status')
      .sort({ username: 1 })
      .limit(20);
  }

  async findById(id: string) {
    const usuario = await this.usuarioModel.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async findOne(id: string) {
    return this.findById(id);
  }

  findByUsername(username: string) {
    return this.usuarioModel.findOne({ username });
  }

  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
    actorId?: string,
  ) {
    const usuario = await this.findById(id);

    const datos: Record<string, unknown> = { ...updateUsuarioDto };
    if (updateUsuarioDto.password) {
      datos.password = await bcryptjs.hash(updateUsuarioDto.password, 12);
    }

    const actualizado = await this.usuarioModel.findByIdAndUpdate(
      usuario._id,
      { $set: datos },
      { new: true, runValidators: true },
    );

    if (!actualizado) throw new NotFoundException('Usuario no encontrado');

    if (actorId) {
      await this.actividadService.registrar(
        actorId,
        Accion.USUARIO_ACTUALIZADO,
        TipoRecurso.USUARIO,
        actualizado._id,
        actualizado.username,
        { campos: Object.keys(updateUsuarioDto) },
      );
    }

    return actualizado;
  }

  async remove(id: string, actorId?: string) {
    const usuario = await this.findById(id);

    const actualizado = await this.usuarioModel.findByIdAndUpdate(
      usuario._id,
      { $set: { status: false } },
      { new: true, runValidators: true },
    );

    if (!actualizado) throw new NotFoundException('Usuario no encontrado');

    if (actorId) {
      await this.actividadService.registrar(
        actorId,
        Accion.USUARIO_DESACTIVADO,
        TipoRecurso.USUARIO,
        actualizado._id,
        actualizado.username,
      );
    }

    return {
      message: 'Usuario desactivado',
      id: actualizado._id,
      status: actualizado.status,
    };
  }

  //MOdificar para que devuelva el username, name, lastname, password, role, status
  findByUsernameWithPassword(Username: string) {
    return this.usuarioModel
      .findOne({ username: Username })
      .select('+password');
  }
}
