import { IsMongoId, IsOptional } from 'class-validator';

export class MoverArchivoDto {
  @IsOptional()
  @IsMongoId()
  parentFolder?: string;
}
