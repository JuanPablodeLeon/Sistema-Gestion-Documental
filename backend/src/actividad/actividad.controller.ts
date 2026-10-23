import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActividadService } from './actividad.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Controller('actividad')
export class ActividadController {
  constructor(private readonly actividadService: ActividadService) {}

  @Get()
  @Auth(Role.ADMIN)
  findAll(@Query() query: Record<string, string>) {
    return this.actividadService.findAll(query);
  }

  @Get('mios')
  @Auth(Role.ADMIN)
  findMine(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: Record<string, string>,
  ) {
    return this.actividadService.findAll({ ...query, userId: user.sub });
  }

  @Get('notificaciones')
  @Auth(Role.USER)
  findNotificaciones(
    @ActiveUser() user: UserActiveInterface,
    @Query() query: Record<string, string>,
  ) {
    return this.actividadService.findNotificaciones(user.sub, query, user.role);
  }

  @Get('usuario/:id')
  @Auth(Role.ADMIN)
  findByUser(@Param('id') id: string, @Query() query: Record<string, string>) {
    return this.actividadService.findAll({ ...query, userId: id });
  }
}
