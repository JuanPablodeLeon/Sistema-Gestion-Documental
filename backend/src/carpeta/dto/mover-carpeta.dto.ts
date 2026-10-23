import { IsMongoId, IsOptional } from 'class-validator';

export class MoverCarpetaDto {
  @IsOptional()
  @IsMongoId()
  parentFolder?: string;
}
