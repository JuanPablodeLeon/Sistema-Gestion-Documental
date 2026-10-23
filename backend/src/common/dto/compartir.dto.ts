import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsMongoId,
  ValidateNested,
} from 'class-validator';
import { NivelAcceso, PermissionType } from 'src/schemas/PermisosDoc.schema';

export class CompartirDto {
  @IsMongoId()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermissionType, { each: true })
  permissions: PermissionType[];
}

export class CompartirUsuarioDto {
  @IsMongoId()
  userId: string;

  @IsEnum(NivelAcceso)
  nivel: NivelAcceso;
}

export class CompartirLoteDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CompartirUsuarioDto)
  usuarios: CompartirUsuarioDto[];
}
