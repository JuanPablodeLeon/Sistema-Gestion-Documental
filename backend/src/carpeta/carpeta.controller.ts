import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CarpetaService } from './carpeta.service';
import { CreateCarpetaDto } from './dto/create-carpeta.dto';
import { UpdateCarpetaDto } from './dto/update-carpeta.dto';

@Controller('carpeta')
export class CarpetaController {
  constructor(private readonly carpetaService: CarpetaService) {}

  @Post()
  create(@Body() createCarpetaDto: CreateCarpetaDto) {
    return this.carpetaService.create(createCarpetaDto);
  }

  @Get()
  findAll() {
    return this.carpetaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carpetaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCarpetaDto: UpdateCarpetaDto) {
    return this.carpetaService.update(+id, updateCarpetaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carpetaService.remove(+id);
  }
}
