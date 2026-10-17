import { PartialType } from '@nestjs/mapped-types';
import { CreateCarpetaDto } from './create-carpeta.dto';

export class UpdateCarpetaDto extends PartialType(CreateCarpetaDto) {}
