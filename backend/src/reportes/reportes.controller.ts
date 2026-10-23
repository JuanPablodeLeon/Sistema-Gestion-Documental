import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('comentarios-reportados')
  @Auth(Role.ADMIN)
  comentariosReportados() {
    return this.reportesService.comentariosReportados();
  }

  @Get('usuarios')
  @Auth(Role.USER)
  usuarios() {
    return this.reportesService.usuarios();
  }

  @Get('archivos/por-tipo')
  @Auth(Role.USER)
  archivosPorTipo() {
    return this.reportesService.archivosPorTipo();
  }

  @Get('archivos/rango-fechas')
  @Auth(Role.USER)
  archivosPorRango(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportesService.archivosPorRango(desde, hasta);
  }

  @Get('archivos/mas-operaciones')
  @Auth(Role.USER)
  archivosMasOperaciones(@Query('limit') limit?: string) {
    return this.reportesService.archivosMasOperaciones(Number(limit) || 10);
  }

  @Get('usuarios/top-archivos')
  @Auth(Role.USER)
  topUsuariosArchivos(@Query('limit') limit?: string) {
    return this.reportesService.topUsuariosArchivos(Number(limit) || 10);
  }

  @Get('usuarios/mas-compartidos')
  @Auth(Role.USER)
  usuariosMasCompartidos(@Query('limit') limit?: string) {
    return this.reportesService.usuariosMasCompartidos(Number(limit) || 10);
  }

  @Get('comparticion/archivos-mas-usuarios')
  @Auth(Role.USER)
  archivosMasCompartidos(@Query('limit') limit?: string) {
    return this.reportesService.archivosMasCompartidos(Number(limit) || 10);
  }

  @Get('comparticion/por-usuario/:id')
  @Auth(Role.USER)
  recursosCompartidosPorUsuario(@Param('id') id: string) {
    return this.reportesService.recursosCompartidosPorUsuario(id);
  }

  @Get('comparticion/recibidos/:id')
  @Auth(Role.USER)
  recursosRecibidosPorUsuario(@Param('id') id: string) {
    return this.reportesService.recursosRecibidosPorUsuario(id);
  }

  @Get('actividad/usuario/:id')
  @Auth(Role.ADMIN)
  actividadUsuario(
    @Param('id') id: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportesService.actividadUsuario(id, desde, hasta);
  }

  @Get('actividad/por-tipo')
  @Auth(Role.USER)
  actividadPorTipo() {
    return this.reportesService.actividadPorTipo();
  }

  @Get('actividad/por-periodo')
  @Auth(Role.USER)
  actividadPorPeriodo(
    @Query('unidad') unidad?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportesService.actividadPorPeriodo(
      unidad ?? 'mes',
      desde,
      hasta,
    );
  }

  @Get('actividad/principales-acciones')
  @Auth(Role.USER)
  principalesAcciones(@Query('limit') limit?: string) {
    return this.reportesService.principalesAcciones(Number(limit) || 10);
  }
}
