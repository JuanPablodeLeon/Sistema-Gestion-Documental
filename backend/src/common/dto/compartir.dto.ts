import { ArrayNotEmpty, IsArray, IsEnum, IsMongoId } from 'class-validator';
import { PermissionType } from 'src/schemas/PermisosDoc.schema';

export class CompartirDto {
  @IsMongoId()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermissionType, { each: true })
  permissions: PermissionType[];
}
