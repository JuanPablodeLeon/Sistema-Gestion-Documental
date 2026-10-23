import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ArchivoService } from './archivo.service';
import { CreateArchivoDto } from './dto/create-archivo.dto';
import { UpdateArchivoDto } from './dto/update-archivo.dto';
import { MoverArchivoDto } from './dto/mover-archivo.dto';
import { CompartirDto, CompartirLoteDto } from 'src/common/dto/compartir.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Controller('archivo')
export class ArchivoController {
  constructor(private readonly archivoService: ArchivoService) {}

  @Get('papelera')
  @Auth(Role.USER)
  findPapelera(@ActiveUser() user: UserActiveInterface) {
    return this.archivoService.findPapelera(user.sub);
  }

  @Get('recibidos')
  @Auth(Role.USER)
  recibidos(@ActiveUser() user: UserActiveInterface) {
    return this.archivoService.recibidos(user.sub);
  }

  @Get()
  @Auth(Role.USER)
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: Record<string, string>,
  ) {
    return this.archivoService.findAll(user.sub, query);
  }

  @Post()
  @Auth(Role.USER)
  create(
    @Body() createArchivoDto: CreateArchivoDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.create(createArchivoDto, user.sub);
  }

  @Get(':id')
  @Auth(Role.USER)
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.archivoService.findOne(id, user.sub);
  }

  @Get(':id/descargar')
  @Auth(Role.USER)
  async descargar(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
    @Res() res: Response,
  ) {
    const archivo = await this.archivoService.descargar(id, user.sub);
    const contentType =
      archivo.type === 'md'
        ? 'text/markdown; charset=utf-8'
        : 'text/plain; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(archivo.name)}`,
    );
    return res.send(archivo.content);
  }

  @Patch(':id')
  @Auth(Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateArchivoDto: UpdateArchivoDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.update(id, updateArchivoDto, user.sub);
  }

  @Patch(':id/mover')
  @Auth(Role.USER)
  mover(
    @Param('id') id: string,
    @Body() moverArchivoDto: MoverArchivoDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.mover(id, moverArchivoDto, user.sub);
  }

  @Patch(':id/restaurar')
  @Auth(Role.USER)
  restaurar(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.archivoService.restaurar(id, user.sub);
  }

  @Delete(':id')
  @Auth(Role.USER)
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.archivoService.remove(id, user.sub);
  }

  @Delete(':id/permanente')
  @Auth(Role.USER)
  eliminarDefinitivo(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.eliminarDefinitivo(id, user.sub);
  }

  @Get(':id/compartir')
  @Auth(Role.USER)
  listarComparticiones(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.listarComparticiones(id, user.sub);
  }

  @Post(':id/compartir')
  @Auth(Role.USER)
  compartir(
    @Param('id') id: string,
    @Body() dto: CompartirDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.compartir(id, dto, user.sub);
  }

  @Post(':id/compartir/lote')
  @Auth(Role.USER)
  compartirVarios(
    @Param('id') id: string,
    @Body() dto: CompartirLoteDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.compartirVarios(id, dto, user.sub);
  }

  @Patch(':id/compartir/:userId')
  @Auth(Role.USER)
  actualizarPermiso(
    @Param('id') id: string,
    @Param('userId') usuarioId: string,
    @Body() dto: CompartirDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.actualizarPermiso(id, usuarioId, dto, user.sub);
  }

  @Delete(':id/compartir/:userId')
  @Auth(Role.USER)
  revocarPermiso(
    @Param('id') id: string,
    @Param('userId') usuarioId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.archivoService.revocarPermiso(id, usuarioId, user.sub);
  }
}
