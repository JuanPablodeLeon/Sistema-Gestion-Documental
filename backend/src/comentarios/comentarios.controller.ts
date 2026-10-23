import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Get('archivo/:id')
  @Auth(Role.USER)
  listarArchivo(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.comentariosService.listar('archivo', id, user.sub);
  }

  @Post('archivo/:id')
  @Auth(Role.USER)
  crearArchivo(
    @Param('id') id: string,
    @Body() dto: CreateComentarioDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.comentariosService.crear('archivo', id, dto, user.sub);
  }

  @Post('archivo/:id/:comentarioId/reportar')
  @Auth(Role.USER)
  reportarArchivo(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.comentariosService.reportar(
      'archivo',
      id,
      comentarioId,
      user.sub,
    );
  }

  @Get('carpeta/:id')
  @Auth(Role.USER)
  listarCarpeta(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.comentariosService.listar('carpeta', id, user.sub);
  }

  @Post('carpeta/:id')
  @Auth(Role.USER)
  crearCarpeta(
    @Param('id') id: string,
    @Body() dto: CreateComentarioDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.comentariosService.crear('carpeta', id, dto, user.sub);
  }

  @Post('carpeta/:id/:comentarioId/reportar')
  @Auth(Role.USER)
  reportarCarpeta(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.comentariosService.reportar(
      'carpeta',
      id,
      comentarioId,
      user.sub,
    );
  }
}
