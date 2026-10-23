import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateArchivoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
