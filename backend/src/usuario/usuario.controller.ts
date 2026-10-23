import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @Auth(Role.ADMIN)
  create(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.usuarioService.create(createUsuarioDto, user.sub);
  }

  @Get()
  @Auth(Role.ADMIN)
  findAll() {
    return this.usuarioService.findAll();
  }

  @Get('buscar')
  @Auth(Role.USER)
  buscar(@Query('username') username = '', @Query('excluir') excluir?: string) {
    return this.usuarioService.buscar(username, excluir);
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.usuarioService.update(id, updateUsuarioDto, user.sub);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.usuarioService.remove(id, user.sub);
  }
}
