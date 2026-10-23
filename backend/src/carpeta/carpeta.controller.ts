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
import { CarpetaService } from './carpeta.service';
import { CreateCarpetaDto } from './dto/create-carpeta.dto';
import { UpdateCarpetaDto } from './dto/update-carpeta.dto';
import { MoverCarpetaDto } from './dto/mover-carpeta.dto';
import { CompartirDto, CompartirLoteDto } from 'src/common/dto/compartir.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Controller('carpeta')
export class CarpetaController {
  constructor(private readonly carpetaService: CarpetaService) {}

  @Get('papelera')
  @Auth(Role.USER)
  findPapelera(@ActiveUser() user: UserActiveInterface) {
    return this.carpetaService.findPapelera(user.sub);
  }

  @Get('recibidas')
  @Auth(Role.USER)
  recibidas(@ActiveUser() user: UserActiveInterface) {
    return this.carpetaService.recibidas(user.sub);
  }

  @Get()
  @Auth(Role.USER)
  findAll(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: Record<string, string>,
  ) {
    return this.carpetaService.findAll(user.sub, query);
  }

  @Post()
  @Auth(Role.USER)
  create(
    @Body() createCarpetaDto: CreateCarpetaDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.create(createCarpetaDto, user.sub);
  }

  @Get(':id')
  @Auth(Role.USER)
  findOne(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.carpetaService.findOne(id, user.sub);
  }

  @Get(':id/contenido')
  @Auth(Role.USER)
  contenido(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.carpetaService.contenido(id, user.sub);
  }

  @Patch(':id')
  @Auth(Role.USER)
  update(
    @Param('id') id: string,
    @Body() updateCarpetaDto: UpdateCarpetaDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.update(id, updateCarpetaDto, user.sub);
  }

  @Patch(':id/mover')
  @Auth(Role.USER)
  mover(
    @Param('id') id: string,
    @Body() moverCarpetaDto: MoverCarpetaDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.mover(id, moverCarpetaDto, user.sub);
  }

  @Patch(':id/restaurar')
  @Auth(Role.USER)
  restaurar(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.carpetaService.restaurar(id, user.sub);
  }

  @Delete(':id')
  @Auth(Role.USER)
  remove(@Param('id') id: string, @ActiveUser() user: UserActiveInterface) {
    return this.carpetaService.remove(id, user.sub);
  }

  @Delete(':id/permanente')
  @Auth(Role.USER)
  eliminarDefinitivo(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.eliminarDefinitivo(id, user.sub);
  }

  @Get(':id/compartir')
  @Auth(Role.USER)
  listarComparticiones(
    @Param('id') id: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.listarComparticiones(id, user.sub);
  }

  @Post(':id/compartir')
  @Auth(Role.USER)
  compartir(
    @Param('id') id: string,
    @Body() dto: CompartirDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.compartir(id, dto, user.sub);
  }

  @Post(':id/compartir/lote')
  @Auth(Role.USER)
  compartirVarios(
    @Param('id') id: string,
    @Body() dto: CompartirLoteDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.compartirVarios(id, dto, user.sub);
  }

  @Patch(':id/compartir/:userId')
  @Auth(Role.USER)
  actualizarPermiso(
    @Param('id') id: string,
    @Param('userId') usuarioId: string,
    @Body() dto: CompartirDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.actualizarPermiso(id, usuarioId, dto, user.sub);
  }

  @Delete(':id/compartir/:userId')
  @Auth(Role.USER)
  revocarPermiso(
    @Param('id') id: string,
    @Param('userId') usuarioId: string,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.carpetaService.revocarPermiso(id, usuarioId, user.sub);
  }
}
